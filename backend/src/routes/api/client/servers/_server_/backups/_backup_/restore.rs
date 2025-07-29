use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
            },
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
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
            "server" = uuid::Uuid,
            description = "The server ID",
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        backup: GetServerBackup,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("backups.restore") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'RESTORING_BACKUP'
            WHERE servers.id = $1 AND servers.status IS NULL",
            server.id
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

        let uuid = server.uuid;
        if let Err(err) = backup
            .restore(&state.database, server.0, data.truncate_directory)
            .await
        {
            transaction.rollback().await?;
            tracing::error!(server = %uuid, backup = %backup.uuid, "failed to restore backup: {:#?}", err);

            return ApiResponse::error("failed to restore backup")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        transaction.commit().await?;

        activity_logger
            .log(
                "server:backup.restore",
                serde_json::json!({
                    "backup": backup.uuid,
                    "name": backup.name,
                    "locked": backup.locked,
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
