use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _api_key_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch,
            user::{GetPermissionManager, GetUser},
            user_api_key::UserApiKey,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        api_keys: Pagination<shared::models::user_api_key::ApiUserApiKey>,
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
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("api-keys.read")?;

        let api_keys = UserApiKey::by_user_uuid_with_pagination(
            &state.database,
            user.uuid,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            api_keys: Pagination {
                total: api_keys.total,
                per_page: api_keys.per_page,
                page: api_keys.page,
                data: api_keys
                    .data
                    .into_iter()
                    .map(|api_key| api_key.into_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            user::{AuthMethod, GetAuthMethod, GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_api_key::UserApiKey,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        name: compact_str::CompactString,

        #[validate(custom(function = "shared::permissions::validate_user_permissions"))]
        user_permissions: Vec<compact_str::CompactString>,
        #[validate(custom(function = "shared::permissions::validate_admin_permissions"))]
        admin_permissions: Vec<compact_str::CompactString>,
        #[validate(custom(function = "shared::permissions::validate_server_permissions"))]
        server_permissions: Vec<compact_str::CompactString>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        api_key: shared::models::user_api_key::ApiUserApiKey,
        key: String,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = FORBIDDEN, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        auth: GetAuthMethod,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("api-keys.create")?;

        if let AuthMethod::ApiKey(api_key) = &*auth
            && (!data
                .user_permissions
                .iter()
                .all(|p| api_key.user_permissions.contains(p))
                || !data
                    .admin_permissions
                    .iter()
                    .all(|p| api_key.admin_permissions.contains(p))
                || !data
                    .server_permissions
                    .iter()
                    .all(|p| api_key.server_permissions.contains(p)))
        {
            return ApiResponse::error("permissions: more permissions than self")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let (key, api_key) = match UserApiKey::create(
            &state.database,
            user.uuid,
            &data.name,
            &data.user_permissions,
            &data.admin_permissions,
            &data.server_permissions,
        )
        .await
        {
            Ok(api_key) => api_key,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("api key with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create api key: {:?}", err);

                return ApiResponse::error("failed to create api key")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "api-key:create",
                serde_json::json!({
                    "uuid": api_key.uuid,
                    "identifier": api_key.key_start,
                    "name": api_key.name,
                    "user_permissions": api_key.user_permissions,
                    "admin_permissions": api_key.admin_permissions,
                    "server_permissions": api_key.server_permissions,
                }),
            )
            .await;

        ApiResponse::json(Response {
            api_key: api_key.into_api_object(),
            key,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{api_key}", _api_key_::router(state))
        .with_state(state.clone())
}
