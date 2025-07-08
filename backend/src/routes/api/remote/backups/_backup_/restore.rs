use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::server_activity::ServerActivity,
        routes::{ApiError, GetState, api::remote::backups::_backup_::GetBackup},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        successful: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        backup: GetBackup,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if sqlx::query!(
            "UPDATE servers
            SET status = NULL
            WHERE servers.id = $1 AND servers.status = 'RESTORING_BACKUP'",
            backup.server_id
        )
        .execute(state.database.write())
        .await
        .unwrap()
        .rows_affected()
            == 0
        {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["server is not restoring a backup"])),
            );
        }

        if let Err(err) = ServerActivity::log(
            &state.database,
            backup.server_id,
            None,
            None,
            if data.successful {
                "server:backup.restore-completed"
            } else {
                "server:backup.restore-failed"
            },
            None,
            serde_json::json!({
                "backup": backup.uuid,
                "name": backup.name,
            }),
        )
        .await
        {
            tracing::warn!(
                backup = %backup.uuid,
                "failed to log server activity: {:#?}",
                err
            );
        }

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
