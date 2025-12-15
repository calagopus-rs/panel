use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

pub mod _server_;
mod groups;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            Pagination,
            server::Server,
            user::{GetPermissionManager, GetUser},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Params {
        #[validate(range(min = 1))]
        #[serde(default = "Pagination::default_page")]
        pub page: i64,
        #[validate(range(min = 1, max = 100))]
        #[serde(default = "Pagination::default_per_page")]
        pub per_page: i64,
        #[validate(length(min = 1, max = 100))]
        #[serde(
            default,
            deserialize_with = "shared::deserialize::deserialize_string_option"
        )]
        pub search: Option<compact_str::CompactString>,

        #[serde(default)]
        other: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<shared::models::server::ApiServer>,
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
        (
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
        (
            "other" = bool, Query,
            description = "If true, returns servers not owned by the user (admin only)",
            example = "false",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("servers.read")?;

        let servers = if params.other && user.admin {
            Server::by_not_user_uuid_with_pagination(
                &state.database,
                user.uuid,
                params.page,
                params.per_page,
                params.search.as_deref(),
            )
            .await
        } else {
            Server::by_user_uuid_with_pagination(
                &state.database,
                user.uuid,
                params.page,
                params.per_page,
                params.search.as_deref(),
            )
            .await
        }?;

        ApiResponse::json(Response {
            servers: servers
                .try_async_map(|server| server.into_api_object(&state.database, &user))
                .await?,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/groups", groups::router(state))
        .nest("/{server}", _server_::router(state))
        .with_state(state.clone())
}
