use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::api::remote::servers::_server_::GetServer;
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        container_image: String,
        entrypoint: String,
        script: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(server: GetServer) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    container_image: server.0.egg.config_script.container,
                    entrypoint: server.0.egg.config_script.entrypoint,
                    script: server.0.egg.config_script.content,
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::server::ServerStatus,
        routes::{GetState, api::remote::servers::_server_::GetServer},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        successful: bool,
        reinstall: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if server.status == Some(ServerStatus::Suspended) {
            return (
                StatusCode::OK,
                axum::Json(serde_json::to_value(Response {}).unwrap()),
            );
        }

        let status = if !data.successful {
            if data.reinstall {
                Some(ServerStatus::ReinstallFailed)
            } else {
                Some(ServerStatus::InstallFailed)
            }
        } else {
            None
        };

        sqlx::query!(
            "UPDATE servers
            SET status = $1
            WHERE id = $2",
            status as Option<ServerStatus>,
            server.0.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .with_state(state.clone())
}
