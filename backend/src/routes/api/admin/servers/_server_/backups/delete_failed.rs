use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            admin_activity::GetAdminActivityLogger,
            server::GetServer,
            server_backup::{FailedServerBackupScope, ServerBackup},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[serde(default)]
        partially_detached: bool,
        force: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        queued: i64,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("nodes.backups")?;

        let scope = if data.partially_detached {
            FailedServerBackupScope::PartiallyDetachedServer {
                server_uuid: server.uuid,
                node_uuid: server.node.uuid,
            }
        } else {
            FailedServerBackupScope::Server(server.uuid)
        };

        let queued = ServerBackup::count_failed(&state.database, scope).await?;

        if queued > 0 {
            let state = state.0.clone();
            let server_uuid = server.uuid;

            tokio::spawn(async move {
                if let Err(err) = ServerBackup::delete_failed(&state, scope, data.force).await {
                    tracing::error!(
                        server = %server_uuid,
                        "failed to delete failed server backups: {:#?}",
                        err
                    );
                }
            });
        }

        activity_logger
            .log(
                "server:backup.delete-failed",
                serde_json::json!({
                    "server_uuid": server.uuid,

                    "partially_detached": data.partially_detached,
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
