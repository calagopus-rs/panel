use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_mount::ServerMount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, mount)): Path<(String, i32)>,
    ) -> ApiResponseResult {
        let server_mount =
            match ServerMount::by_server_id_mount_id(&state.database, server.id, mount).await? {
                Some(mount) => mount,
                None => {
                    return ApiResponse::error("mount not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if !server_mount.mount.user_mountable {
            return ApiResponse::json(ApiError::new_value(&["mount not found"]))
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        }

        ServerMount::delete_by_ids(&state.database, server.id, server_mount.mount.id).await?;

        activity_logger
            .log(
                "server:mount.delete",
                serde_json::json!({
                    "mount_id": server_mount.mount.id,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
