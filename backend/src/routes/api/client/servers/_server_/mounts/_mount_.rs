use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_mount::ServerMount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{
                GetPermissionManager,
                servers::_server_::{GetServer, GetServerActivityLogger},
            },
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
            "mount" = uuid::Uuid,
            description = "The mount ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, mount)): Path<(String, uuid::Uuid)>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("mounts.detach")?;

        let server_mount =
            match ServerMount::by_server_uuid_mount_uuid(&state.database, server.uuid, mount)
                .await?
            {
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

        ServerMount::delete_by_uuids(&state.database, server.uuid, server_mount.mount.uuid).await?;

        activity_logger
            .log(
                "server:mount.detach",
                serde_json::json!({
                    "mount_uuid": server_mount.mount.uuid,
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
