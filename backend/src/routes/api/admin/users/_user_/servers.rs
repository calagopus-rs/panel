use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::api::admin::users::_user_::GetParamUser;
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{Pagination, server::Server, user::GetPermissionManager},
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
        owned: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<shared::models::server::AdminApiServer>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = uuid::Uuid,
            description = "The user ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
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
        permissions: GetPermissionManager,
        user: GetParamUser,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("servers.read")?;

        let servers = if params.owned {
            Server::by_owner_uuid_with_pagination(
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

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            servers: servers
                .try_async_map(|server| {
                    server.into_admin_api_object(&state.database, &storage_url_retriever)
                })
                .await?,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
