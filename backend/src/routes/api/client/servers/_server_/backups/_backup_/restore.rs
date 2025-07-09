use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{
            GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("backups.restore") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        if backup.completed.is_none() {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["backup has not been completed yet"])),
            );
        }

        let mut transaction = state.database.write().begin().await.unwrap();

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'RESTORING_BACKUP'
            WHERE servers.id = $1 AND servers.status IS NULL",
            server.id
        )
        .execute(&mut *transaction)
        .await
        .unwrap()
        .rows_affected();

        if rows_affected == 0 {
            transaction.rollback().await.unwrap();

            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&[
                    "server is not in a valid state to restore backup.",
                ])),
            );
        }

        let uuid = server.uuid;
        if let Err(err) = backup
            .restore(&state.database, server.0, data.truncate_directory)
            .await
        {
            transaction.rollback().await.unwrap();
            tracing::error!(server = %uuid, backup = %backup.uuid, "failed to restore backup: {:#?}", err);

            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiError::new_value(&["failed to restore backup"])),
            );
        }

        transaction.commit().await.unwrap();

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

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
