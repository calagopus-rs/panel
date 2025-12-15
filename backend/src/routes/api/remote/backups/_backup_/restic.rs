use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::api::remote::backups::_backup_::GetBackup;
    use axum::http::StatusCode;
    use indexmap::IndexMap;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::server_backup::BackupDisk,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        repository: compact_str::CompactString,
        retry_lock_seconds: u64,
        environment: IndexMap<compact_str::CompactString, compact_str::CompactString>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(state: GetState, backup: GetBackup) -> ApiResponseResult {
        if backup.disk != BackupDisk::Restic {
            return ApiResponse::error("backup is not stored on restic")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let backup_configuration = match backup.0.backup_configuration {
            Some(backup_configuration) => {
                backup_configuration.fetch_cached(&state.database).await?
            }
            None => {
                return ApiResponse::error("backup does not have a backup configuration assigned")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };

        let mut restic_configuration = match backup_configuration.backup_configs.restic {
            Some(config) => config,
            None => {
                return ApiResponse::error("restic configuration not found")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };
        restic_configuration.decrypt(&state.database).await?;

        ApiResponse::json(Response {
            repository: restic_configuration.repository,
            retry_lock_seconds: restic_configuration.retry_lock_seconds,
            environment: restic_configuration.environment,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
