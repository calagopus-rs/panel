use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _location_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, location::Location},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        locations: Pagination<crate::models::location::AdminApiLocation>,
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
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let locations = Location::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            locations: Pagination {
                total: locations.total,
                per_page: locations.per_page,
                page: locations.page,
                data: locations
                    .data
                    .into_iter()
                    .map(|location| location.into_admin_api_object(&state.database))
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::location::Location,
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::GetAdminActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 31))]
        #[schema(min_length = 2, max_length = 31)]
        short_name: String,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        backup_disk: crate::models::server_backup::BackupDisk,
        backup_configs: crate::models::location::LocationBackupConfigs,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        location: crate::models::location::AdminApiLocation,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let location = match Location::create(
            &state.database,
            &data.short_name,
            &data.name,
            data.description.as_deref(),
            data.backup_disk,
            data.backup_configs,
        )
        .await
        {
            Ok(location) => location,
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("location with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create location: {:#?}", err);

                return ApiResponse::error("failed to create location")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        let mut backup_configs = location.backup_configs.clone();
        backup_configs.censor();

        activity_logger
            .log(
                "location:create",
                serde_json::json!({
                    "short_name": location.short_name,
                    "name": location.name,
                    "description": location.description,

                    "backup_disk": location.backup_disk,
                    "backup_configs": backup_configs,
                }),
            )
            .await;

        ApiResponse::json(Response {
            location: location.into_admin_api_object(&state.database),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{location}", _location_::router(state))
        .with_state(state.clone())
}
