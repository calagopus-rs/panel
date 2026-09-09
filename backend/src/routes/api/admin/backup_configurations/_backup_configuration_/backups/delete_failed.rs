use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::api::admin::backup_configurations::_backup_configuration_::GetBackupConfiguration;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            admin_activity::GetAdminActivityLogger,
            server_backup::{FailedServerBackupScope, ServerBackup},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        force: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        queued: i64,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
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
        backup_configuration: GetBackupConfiguration,
        activity_logger: GetAdminActivityLogger,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("backup-configurations.backups")?;
        permissions.has_admin_permission("nodes.backups")?;

        let scope = FailedServerBackupScope::BackupConfiguration(backup_configuration.uuid);
        let queued = ServerBackup::count_failed(&state.database, scope).await?;

        if queued > 0 {
            let state = state.0.clone();
            let backup_configuration_uuid = backup_configuration.uuid;

            tokio::spawn(async move {
                if let Err(err) = ServerBackup::delete_failed(&state, scope, data.force).await {
                    tracing::error!(
                        backup_configuration = %backup_configuration_uuid,
                        "failed to delete failed backup configuration backups: {:#?}",
                        err
                    );
                }
            });
        }

        activity_logger
            .log(
                "backup-configuration:backup.delete-failed",
                serde_json::json!({
                    "backup_configuration_uuid": backup_configuration.uuid,

                    "name": backup_configuration.name,
                    "force": data.force,
                    "queued": queued,
                }),
            )
            .await;

        ApiResponse::new_serialized(Response { queued }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
