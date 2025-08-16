use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::server_activity::ServerActivity,
        response::{ApiResponse, ApiResponseResult},
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
    ) -> ApiResponseResult {
        let server_uuid = match backup.server_uuid {
            Some(id) => id,
            None => {
                return ApiResponse::error("server uuid not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if sqlx::query!(
            "UPDATE servers
            SET status = NULL
            WHERE servers.uuid = $1 AND servers.status = 'RESTORING_BACKUP'",
            server_uuid
        )
        .execute(state.database.write())
        .await?
        .rows_affected()
            == 0
        {
            return ApiResponse::error("server is not restoring a backup")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if let Err(err) = ServerActivity::log(
            &state.database,
            server_uuid,
            None,
            None,
            if data.successful {
                "server:backup.restore-completed"
            } else {
                "server:backup.restore-failed"
            },
            None,
            serde_json::json!({
                "uuid": backup.uuid,
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

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
