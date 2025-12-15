use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use shared::{
        models::server::GetServer,
        response::{ApiResponse, ApiResponseResult},
    };

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(wings_api::InstallationScript)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(server: GetServer) -> ApiResponseResult {
        ApiResponse::json(wings_api::InstallationScript {
            container_image: server.0.egg.config_script.container,
            entrypoint: server.0.egg.config_script.entrypoint,
            script: server.0.egg.config_script.content.into(),
            environment: Default::default(),
        })
        .ok()
    }
}

mod post {
    use serde::{Deserialize, Serialize};
    use shared::{
        GetState,
        models::server::{GetServer, ServerStatus},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        successful: bool,
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
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let status = if !data.successful {
            Some(ServerStatus::InstallFailed)
        } else {
            None
        };

        sqlx::query!(
            "UPDATE servers
            SET status = $1
            WHERE servers.uuid = $2",
            status as Option<ServerStatus>,
            server.0.uuid
        )
        .execute(state.database.write())
        .await?;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .with_state(state.clone())
}
