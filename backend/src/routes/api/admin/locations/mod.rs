use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _location_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, location::Location, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        locations: Pagination<shared::models::location::AdminApiLocation>,
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

        permissions.has_admin_permission("locations.read")?;

        let locations = Location::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            locations: locations
                .async_map(|location| location.into_admin_api_object(&state.database))
                .await,
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
            ByUuid, admin_activity::GetAdminActivityLogger,
            backup_configurations::BackupConfiguration, location::Location,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        backup_configuration_uuid: Option<uuid::Uuid>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: compact_str::CompactString,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        location: shared::models::location::AdminApiLocation,
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

        permissions.has_admin_permission("locations.create")?;

        let backup_configuration = if let Some(backup_configuration_uuid) =
            data.backup_configuration_uuid
            && !backup_configuration_uuid.is_nil()
        {
            match BackupConfiguration::by_uuid_optional(&state.database, backup_configuration_uuid)
                .await?
            {
                Some(backup_configuration) => Some(backup_configuration),
                None => {
                    return ApiResponse::error("backup configuration not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            }
        } else {
            None
        };

        let location = match Location::create(
            &state.database,
            backup_configuration.map(|backup_configuration| backup_configuration.uuid),
            &data.name,
            data.description.as_deref(),
        )
        .await
        {
            Ok(location) => location,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("location with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create location: {:?}", err);

                return ApiResponse::error("failed to create location")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "location:create",
                serde_json::json!({
                    "uuid": location.uuid,
                    "name": location.name,
                    "description": location.description,
                }),
            )
            .await;

        ApiResponse::json(Response {
            location: location.into_admin_api_object(&state.database).await,
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
