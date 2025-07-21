use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::node_mount::NodeMount,
        routes::{
            ApiError, GetState,
            api::{admin::nodes::_node_::GetNode, client::GetUserActivityLogger},
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
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        activity_logger: GetUserActivityLogger,
        Path((_node, mount)): Path<(i32, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let node_mount = match NodeMount::by_node_id_mount_id(&state.database, node.id, mount).await
        {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        NodeMount::delete_by_ids(&state.database, node.id, node_mount.mount.id).await;

        activity_logger
            .log(
                "admin:node.mount.delete",
                serde_json::json!({
                    "node_id": node.id,
                    "mount_id": node_mount.mount.id,
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
