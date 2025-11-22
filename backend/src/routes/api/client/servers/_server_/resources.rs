use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::server::GetServer,
        response::{ApiResponse, ApiResponseResult},
    };
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
        let resources = state
            .cache
            .cached(
                &format!("server::{}::resources", server.uuid),
                10,
                || async {
                    Ok::<_, anyhow::Error>(
                        server
                            .node
                            .fetch_cached(&state.database)
                            .await?
                            .api_client(&state.database)
                            .get_servers_server(server.uuid)
                            .await?
                            .utilization,
                    )
                },
            )
            .await?;

        ApiResponse::json(Response { resources }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
