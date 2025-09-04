use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{
            server_activity::ServerActivity,
            server_backup::{BackupDisk, ServerBackup},
        },
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::remote::servers::_server_::GetServer},
    };
    use reqwest::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;
    use wings_api::BackupAdapter;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        name: Option<String>,

        ignored_files: Vec<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        adapter: BackupAdapter,
        uuid: uuid::Uuid,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let backups = ServerBackup::count_by_server_uuid(&state.database, server.uuid).await;
        if backups >= server.backup_limit as i64
            && let Err(err) =
                ServerBackup::delete_oldest_by_server_uuid(&state.database, &server).await
        {
            tracing::error!(server = %server.uuid, "failed to delete old backup: {:#?}", err);

            return ApiResponse::error("maximum number of backups reached")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        state
            .cache
            .ratelimit(
                format!("client/servers/{}/backups/create", server.uuid),
                4,
                120,
                server.uuid,
            )
            .await?;

        let name = data.name.unwrap_or_else(|| {
            format!("Backup {}", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"))
        });

        let backup =
            match ServerBackup::create_raw(&state.database, &server, &name, data.ignored_files)
                .await
            {
                Ok(backup) => backup,
                Err(err) => {
                    tracing::error!(name = %name, "failed to create backup: {:#?}", err);

                    return ApiResponse::error("failed to create backup")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };

        if let Err(err) = ServerActivity::log_remote(
            &state.database,
            server.uuid,
            None,
            "server:backup.create",
            None,
            serde_json::json!({
                "uuid": backup.uuid,
                "name": backup.name,
                "ignored_files": backup.ignored_files,
            }),
            chrono::Utc::now(),
        )
        .await
        {
            tracing::warn!(
                server = %server.uuid,
                "failed to log remote activity for server: {:#?}",
                err
            );
        }

        ApiResponse::json(Response {
            adapter: match backup.disk {
                BackupDisk::Local => wings_api::BackupAdapter::Wings,
                BackupDisk::S3 => wings_api::BackupAdapter::S3,
                BackupDisk::DdupBak => wings_api::BackupAdapter::DdupBak,
                BackupDisk::Btrfs => wings_api::BackupAdapter::Btrfs,
                BackupDisk::Zfs => wings_api::BackupAdapter::Zfs,
                BackupDisk::Restic => wings_api::BackupAdapter::Restic,
            },
            uuid: backup.uuid,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
