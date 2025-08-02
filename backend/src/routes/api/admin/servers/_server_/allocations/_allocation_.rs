use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_allocation::ServerAllocation,
        response::{ApiResponse, ApiResponseResult},
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
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
        (
            "allocation" = i32,
            description = "The allocation ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetUserActivityLogger,
        Path((_server, allocation)): Path<(String, i32)>,
    ) -> ApiResponseResult {
        let allocation = match ServerAllocation::by_server_id_id(
            &state.database,
            server.id,
            allocation,
        )
        .await?
        {
            Some(allocation) => allocation,
            None => {
                return ApiResponse::error("allocation not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        ServerAllocation::delete_by_id(&state.database, allocation.id).await?;

        activity_logger
            .log(
                "admin:server.allocation.delete",
                serde_json::json!({
                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,
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
