use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _location_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, location::Location},
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
    ))]
    pub async fn route(
        state: GetState,
        Query(params): Query<PaginationParams>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let locations =
            Location::all_with_pagination(&state.database, params.page, params.per_page).await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    locations: Pagination {
                        total: locations.total,
                        per_page: locations.per_page,
                        page: locations.page,
                        data: locations
                            .data
                            .into_iter()
                            .map(|location| location.into_admin_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::location::Location,
        routes::{ApiError, GetState, api::client::GetUserActivityLogger},
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
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["location with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to create location: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to create location"])),
                );
            }
        };

        let location = location.into_admin_api_object();

        activity_logger
            .log(
                "admin:location.create",
                serde_json::json!({
                    "short_name": location.short_name,
                    "name": location.name,
                    "description": location.description,

                    "backup_disk": location.backup_disk,
                    "backup_configs": location.backup_configs,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response { location }).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{location}", _location_::router(state))
        .with_state(state.clone())
}
