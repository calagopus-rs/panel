use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, backup_configurations::BackupConfiguration, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod locations;
mod nodes;
mod servers;
mod stats;

pub type GetBackupConfiguration = shared::extract::ConsumingExtension<BackupConfiguration>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(backup_configuration): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let backup_configuration = match backup_configuration
        .first()
        .map(|s| s.parse::<uuid::Uuid>())
    {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid backup configuration uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("locations.read") {
        return Ok(err.into_response());
    }

    let backup_configuration =
        BackupConfiguration::by_uuid_optional(&state.database, backup_configuration).await;
    let backup_configuration = match backup_configuration {
        Ok(Some(backup_configuration)) => backup_configuration,
        Ok(None) => {
            return Ok(ApiResponse::error("location not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(backup_configuration);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::backup_configurations::_backup_configuration_::GetBackupConfiguration;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        backup_configuration: shared::models::backup_configurations::AdminApiBackupConfiguration,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "backup_configuration" = uuid::Uuid,
            description = "The backup configuration ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        backup_configuration: GetBackupConfiguration,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("backup-configurations.read")?;

        ApiResponse::json(Response {
            backup_configuration: backup_configuration
                .0
                .into_admin_api_object(&state.database)
                .await?,
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::backup_configurations::_backup_configuration_::GetBackupConfiguration;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "backup_configuration" = uuid::Uuid,
            description = "The backup configuration ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        backup_configuration: GetBackupConfiguration,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("backup-configurations.delete")?;

        backup_configuration.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "backup-configuration:delete",
                serde_json::json!({
                    "uuid": backup_configuration.uuid,
                    "name": backup_configuration.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::backup_configurations::_backup_configuration_::GetBackupConfiguration;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        backup_disk: Option<shared::models::server_backup::BackupDisk>,
        backup_configs: Option<shared::models::backup_configurations::BackupConfigs>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "backup_configuration" = uuid::Uuid,
            description = "The backup configuration ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut backup_configuration: GetBackupConfiguration,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("backup-configuration.update")?;

        if let Some(name) = data.name {
            backup_configuration.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                backup_configuration.description = None;
            } else {
                backup_configuration.description = Some(description);
            }
        }
        if let Some(backup_disk) = data.backup_disk {
            backup_configuration.backup_disk = backup_disk;
        }
        if let Some(backup_configs) = data.backup_configs {
            backup_configuration.backup_configs = backup_configs;
            backup_configuration
                .backup_configs
                .encrypt(&state.database)
                .await?;
        }

        match sqlx::query!(
            "UPDATE backup_configurations
            SET name = $2, description = $3, backup_disk = $4, backup_configs = $5
            WHERE backup_configurations.uuid = $1",
            backup_configuration.uuid,
            &backup_configuration.name,
            backup_configuration.description.as_deref(),
            backup_configuration.backup_disk as shared::models::server_backup::BackupDisk,
            serde_json::to_value(&backup_configuration.backup_configs)?,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("backup configuration with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update backup configuration: {:?}", err);

                return ApiResponse::error("failed to update backup configuration")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "backup-configuration:update",
                serde_json::json!({
                    "uuid": backup_configuration.uuid,
                    "name": backup_configuration.name,
                    "description": backup_configuration.description,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/stats", stats::router(state))
        .nest("/locations", locations::router(state))
        .nest("/nodes", nodes::router(state))
        .nest("/servers", servers::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
