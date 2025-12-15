use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _backup_configuration_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, backup_configurations::BackupConfiguration,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        backup_configurations:
            Pagination<shared::models::backup_configurations::AdminApiBackupConfiguration>,
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

        permissions.has_admin_permission("backup-configurations.read")?;

        let backup_configurations = BackupConfiguration::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            backup_configurations: backup_configurations
                .try_async_map(|backup_configuration| {
                    backup_configuration.into_admin_api_object(&state.database)
                })
                .await?,
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
            admin_activity::GetAdminActivityLogger, backup_configurations::BackupConfiguration,
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
        name: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        backup_disk: shared::models::server_backup::BackupDisk,
        #[serde(default)]
        backup_configs: shared::models::backup_configurations::BackupConfigs,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        backup_configuration: shared::models::backup_configurations::AdminApiBackupConfiguration,
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

        permissions.has_admin_permission("backup-configurations.create")?;

        let backup_configuration = match BackupConfiguration::create(
            &state.database,
            &data.name,
            data.description.as_deref(),
            data.backup_disk,
            data.backup_configs,
        )
        .await
        {
            Ok(backup_configuration) => backup_configuration,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("backup configuration with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create backup configuration: {:?}", err);

                return ApiResponse::error("failed to create backup configuration")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "backup-configuration:create",
                serde_json::json!({
                    "uuid": backup_configuration.uuid,
                    "name": backup_configuration.name,
                    "description": backup_configuration.description,
                }),
            )
            .await;

        ApiResponse::json(Response {
            backup_configuration: backup_configuration
                .into_admin_api_object(&state.database)
                .await?,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest(
            "/{backup_configuration}",
            _backup_configuration_::router(state),
        )
        .with_state(state.clone())
}
