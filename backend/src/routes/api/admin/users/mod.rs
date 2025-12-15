use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _user_;
mod external;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch,
            user::{GetPermissionManager, User},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        users: Pagination<shared::models::user::ApiFullUser>,
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
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("users.read")?;

        let users = User::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            users: Pagination {
                total: users.total,
                per_page: users.per_page,
                page: users.page,
                data: users
                    .data
                    .into_iter()
                    .map(|user| user.into_api_full_object(&storage_url_retriever))
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
            ByUuid,
            admin_activity::GetAdminActivityLogger,
            role::Role,
            user::{GetPermissionManager, User},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        role_uuid: Option<uuid::Uuid>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<compact_str::CompactString>,

        #[validate(
            length(min = 3, max = 15),
            regex(path = "*shared::models::user::USERNAME_REGEX")
        )]
        #[schema(min_length = 3, max_length = 15)]
        #[schema(pattern = "^[a-zA-Z0-9_]+$")]
        username: compact_str::CompactString,
        #[validate(email)]
        #[schema(format = "email")]
        email: String,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_first: compact_str::CompactString,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_last: compact_str::CompactString,
        #[validate(length(min = 8, max = 512))]
        #[schema(min_length = 8, max_length = 512)]
        password: String,

        admin: bool,

        #[validate(
            length(min = 5, max = 15),
            custom(function = "shared::validate_language")
        )]
        #[schema(min_length = 5, max_length = 15)]
        language: compact_str::CompactString,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: shared::models::user::ApiFullUser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("users.create")?;

        let role = if let Some(role_uuid) = data.role_uuid
            && !role_uuid.is_nil()
        {
            match Role::by_uuid_optional(&state.database, role_uuid).await? {
                Some(role) => Some(role),
                None => {
                    return ApiResponse::error("role not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            }
        } else {
            None
        };

        let user = match User::create(
            &state.database,
            role.as_ref().map(|role| role.uuid),
            data.external_id.as_deref(),
            &data.username,
            &data.email,
            &data.name_first,
            &data.name_last,
            &data.password,
            data.admin,
            &data.language,
        )
        .await
        {
            Ok(user_uuid) => User::by_uuid(&state.database, user_uuid).await?,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("user with email/username already exists").ok();
            }
            Err(err) => {
                tracing::error!("failed to create user: {:?}", err);

                return ApiResponse::error("failed to create user")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "user:create",
                serde_json::json!({
                    "uuid": user.uuid,
                    "role_uuid": role.map(|r| r.uuid),
                    "username": user.username,
                    "email": user.email,
                    "name_first": user.name_first,
                    "name_last": user.name_last,
                    "admin": user.admin,
                    "language": user.language,
                }),
            )
            .await;

        ApiResponse::json(Response {
            user: user.into_api_full_object(&state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{user}", _user_::router(state))
        .nest("/external", external::router(state))
        .with_state(state.clone())
}
