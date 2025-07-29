use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server::Server},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::users::_user_::GetParamUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<crate::models::server::AdminApiServer>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = i32,
            description = "The user ID",
            example = "1",
        ),
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
        (
            "search" = Option<String>, Query,
            description = "Search term for server name",
            example = "example-server",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetParamUser,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let servers = Server::by_owner_id_with_pagination(
            &state.database,
            user.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            servers: Pagination {
                total: servers.total,
                per_page: servers.per_page,
                page: servers.page,
                data: servers
                    .data
                    .into_iter()
                    .map(|server| server.into_admin_api_object(&state.database))
                    .collect(),
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
