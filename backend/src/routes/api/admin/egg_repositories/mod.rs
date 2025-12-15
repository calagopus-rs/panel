use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _egg_repository_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, egg_repository::EggRepository,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        egg_repositories: Pagination<shared::models::egg_repository::AdminApiEggRepository>,
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

        permissions.has_admin_permission("egg-repositories.read")?;

        let egg_repositories = EggRepository::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            egg_repositories: Pagination {
                total: egg_repositories.total,
                per_page: egg_repositories.per_page,
                page: egg_repositories.page,
                data: egg_repositories
                    .data
                    .into_iter()
                    .map(|egg_repository| egg_repository.into_admin_api_object())
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
            admin_activity::GetAdminActivityLogger, egg_repository::EggRepository,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: compact_str::CompactString,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        #[validate(url)]
        #[schema(example = "https://github.com/example/repo.git", format = "uri")]
        git_repository: compact_str::CompactString,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        egg_repository: shared::models::egg_repository::AdminApiEggRepository,
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

        permissions.has_admin_permission("egg-repositories.create")?;

        let egg_repository = match EggRepository::create(
            &state.database,
            &data.name,
            data.description.as_deref(),
            &data.git_repository,
        )
        .await
        {
            Ok(egg_repository) => egg_repository,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error(
                    "egg repository with name/git repository already exists",
                )
                .with_status(StatusCode::CONFLICT)
                .ok();
            }
            Err(err) => {
                tracing::error!("failed to create egg repository: {:?}", err);

                return ApiResponse::error("failed to create egg repository")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "egg-repository:create",
                serde_json::json!({
                    "uuid": egg_repository.uuid,
                    "name": egg_repository.name,
                    "description": egg_repository.description,
                    "git_repository": egg_repository.git_repository,
                }),
            )
            .await;

        ApiResponse::json(Response {
            egg_repository: egg_repository.into_admin_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{egg_repository}", _egg_repository_::router(state))
        .with_state(state.clone())
}
