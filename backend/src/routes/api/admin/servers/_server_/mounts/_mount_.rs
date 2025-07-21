use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_mount::ServerMount,
        routes::{
            ApiError, GetState,
            api::{admin::servers::_server_::GetServer, client::GetUserActivityLogger},
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
            "server" = i32,
            description = "The server ID",
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
        server: GetServer,
        activity_logger: GetUserActivityLogger,
        Path((_server, mount)): Path<(String, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let server_mount =
            match ServerMount::by_server_id_mount_id(&state.database, server.id, mount).await {
                Some(mount) => mount,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["mount not found"])),
                    );
                }
            };

        ServerMount::delete_by_ids(&state.database, server.id, server_mount.mount.id).await;

        activity_logger
            .log(
                "admin:server.mount.delete",
                serde_json::json!({
                    "server_id": server.id,
                    "mount_id": server_mount.mount.id,
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
