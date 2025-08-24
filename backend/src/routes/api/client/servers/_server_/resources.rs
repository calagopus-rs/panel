use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{GetState, api::client::servers::_server_::GetServer},
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        resources: wings_api::ResourceUsage,
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
    pub async fn route(state: GetState, server: GetServer) -> ApiResponseResult {
        let server_details = match server
            .node
            .api_client(&state.database)
            .get_servers_server(server.uuid)
            .await
        {
            Ok(data) => data,
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to get server details: {:#?}", err);

                return ApiResponse::error("failed to get server details")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        ApiResponse::json(Response {
            resources: server_details.utilization,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
