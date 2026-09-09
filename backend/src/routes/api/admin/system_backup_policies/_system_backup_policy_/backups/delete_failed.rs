use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::api::admin::system_backup_policies::_system_backup_policy_::GetSystemBackupPolicy;
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
            "system_backup_policy" = uuid::Uuid,
            description = "The system backup policy ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        system_backup_policy: GetSystemBackupPolicy,
        activity_logger: GetAdminActivityLogger,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("system-backup-policies.backups")?;
        permissions.has_admin_permission("nodes.backups")?;

        let scope = FailedServerBackupScope::SystemBackupPolicy(system_backup_policy.uuid);
        let queued = ServerBackup::count_failed(&state.database, scope).await?;

        if queued > 0 {
            let state = state.0.clone();
            let system_backup_policy_uuid = system_backup_policy.uuid;

            tokio::spawn(async move {
                if let Err(err) = ServerBackup::delete_failed(&state, scope, data.force).await {
                    tracing::error!(
                        system_backup_policy = %system_backup_policy_uuid,
                        "failed to delete failed system backup policy backups: {:#?}",
                        err
                    );
                }
            });
        }

        activity_logger
            .log(
                "system-backup-policy:backup.delete-failed",
                serde_json::json!({
                    "system_backup_policy_uuid": system_backup_policy.uuid,

                    "name": system_backup_policy.name,
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
