use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::api::admin::nodes::_node_::backups::_backup_::GetServerBackup;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger, node::GetNode, server::Server,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        server_uuid: uuid::Uuid,

        truncate_directory: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        node: GetNode,
        backup: GetServerBackup,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("nodes.backups")?;

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let server =
            match Server::by_uuid_optional_cached(&state.database, data.server_uuid).await? {
                Some(server) => server,
                None => {
                    return ApiResponse::error("server not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        let mut transaction = state.database.write().begin().await?;

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'RESTORING_BACKUP'
            WHERE servers.uuid = $1 AND servers.status IS NULL",
            server.uuid
        )
        .execute(&mut *transaction)
        .await?
        .rows_affected();

        if rows_affected == 0 {
            transaction.rollback().await?;

            return ApiResponse::error("server is not in a valid state to restore backup.")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let backup_uuid = backup.uuid;
        let backup_name = backup.name.clone();

        let uuid = server.uuid;
        if let Err(err) = backup
            .0
            .restore(&state.database, server, data.truncate_directory)
            .await
        {
            transaction.rollback().await?;
            tracing::error!(server = %uuid, backup = %backup_uuid, "failed to restore backup: {:?}", err);

            return ApiResponse::error("failed to restore backup")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        transaction.commit().await?;

        activity_logger
            .log(
                "node:backup.restore",
                serde_json::json!({
                    "uuid": backup_uuid,
                    "node_uuid": node.uuid,
                    "server_uuid": data.server_uuid,

                    "name": backup_name,
                    "truncate_directory": data.truncate_directory,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
