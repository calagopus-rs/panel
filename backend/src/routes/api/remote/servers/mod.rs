use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _server_;
mod reset;

mod get {
    use crate::{
        models::{PaginationParams, server::Server},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::remote::GetNode},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseMeta {
        current_page: i64,
        last_page: i64,
        total: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        data: Vec<crate::models::server::RemoteApiServer>,
        #[schema(inline)]
        meta: ResponseMeta,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        Query(params): Query<PaginationParams>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let servers = Server::by_node_uuid_with_pagination(
            &state.database,
            node.uuid,
            params.page,
            params.per_page,
            None,
        )
        .await?;

        ApiResponse::json(Response {
            data: {
                let mut api_servers = Vec::new();
                api_servers.reserve_exact(servers.data.len());

                for server in servers.data {
                    api_servers.push(server.into_remote_api_object(&state.database).await);
                }

                api_servers
            },
            meta: ResponseMeta {
                current_page: servers.page,
                last_page: (servers.total as f64 / servers.per_page as f64).ceil() as i64,
                total: servers.total,
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/{server}", _server_::router(state))
        .nest("/reset", reset::router(state))
        .with_state(state.clone())
}
