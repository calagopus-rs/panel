use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _mount_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, mount::Mount, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        mounts: Pagination<shared::models::mount::AdminApiMount>,
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

        permissions.has_admin_permission("mounts.read")?;

        let mounts = Mount::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            mounts: Pagination {
                total: mounts.total,
                per_page: mounts.per_page,
                page: mounts.page,
                data: mounts
                    .data
                    .into_iter()
                    .map(|mount| mount.into_admin_api_object())
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
            admin_activity::GetAdminActivityLogger, mount::Mount, user::GetPermissionManager,
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

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        source: compact_str::CompactString,
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        target: compact_str::CompactString,

        read_only: bool,
        user_mountable: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        mount: shared::models::mount::AdminApiMount,
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

        permissions.has_admin_permission("mounts.create")?;

        let mount = match Mount::create(
            &state.database,
            &data.name,
            data.description.as_deref(),
            &data.source,
            &data.target,
            data.read_only,
            data.user_mountable,
        )
        .await
        {
            Ok(mount) => mount,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("mount with name/source/location already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create mount: {:?}", err);

                return ApiResponse::error("failed to create mount")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "mount:create",
                serde_json::json!({
                    "uuid": mount.uuid,
                    "name": mount.name,
                    "description": mount.description,

                    "source": mount.source,
                    "target": mount.target,

                    "read_only": mount.read_only,
                    "user_mountable": mount.user_mountable,
                }),
            )
            .await;

        ApiResponse::json(Response {
            mount: mount.into_admin_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{mount}", _mount_::router(state))
        .with_state(state.clone())
}
