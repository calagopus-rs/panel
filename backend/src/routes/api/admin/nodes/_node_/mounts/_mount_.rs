use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::node_mount::NodeMount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, nodes::_node_::GetNode},
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
            "node" = uuid::Uuid,
            description = "The node ID",
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
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
        Path((_node, mount)): Path<(uuid::Uuid, uuid::Uuid)>,
    ) -> ApiResponseResult {
        let node_mount =
            match NodeMount::by_node_uuid_mount_uuid(&state.database, node.uuid, mount).await? {
                Some(mount) => mount,
                None => {
                    return ApiResponse::error("mount not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        NodeMount::delete_by_uuids(&state.database, node.uuid, node_mount.mount.uuid).await?;

        activity_logger
            .log(
                "node:mount.delete",
                serde_json::json!({
                    "node_uuid": node.uuid,
                    "mount_uuid": node_mount.mount.uuid,
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
