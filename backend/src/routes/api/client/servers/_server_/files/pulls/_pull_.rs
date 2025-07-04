use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "pull" = uuid::Uuid,
            description = "The pull ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, pull)): Path<(uuid::Uuid, uuid::Uuid)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("file.delete") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        match server
            .node
            .api_client(&state.database)
            .delete_servers_server_files_pull_pull(server.uuid, pull)
            .await
        {
            Ok(_) => {}
            Err((StatusCode::NOT_FOUND, _)) => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["pull not found"])),
                );
            }
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to delete server file pull: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to delete server file pull"])),
                );
            }
        };

        activity_logger
            .log(
                "server:file.abort-pull",
                serde_json::json!({
                    "identifier": pull,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
