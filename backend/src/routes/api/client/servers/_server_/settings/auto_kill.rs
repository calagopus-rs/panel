use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        enabled: bool,

        #[validate(range(min = 1, max = 3600))]
        #[schema(minimum = 1, maximum = 3600)]
        seconds: Option<u64>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
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
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("settings.auto-kill")?;

        server.auto_kill.enabled = data.enabled;
        if let Some(seconds) = data.seconds {
            server.auto_kill.seconds = seconds;
        }

        sqlx::query!(
            "UPDATE servers
            SET auto_kill = $1
            WHERE servers.uuid = $2",
            serde_json::to_value(&server.auto_kill)?,
            server.uuid
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:settings.auto-kill",
                serde_json::json!({
                    "enabled": server.auto_kill.enabled,
                    "seconds": server.auto_kill.seconds,
                }),
            )
            .await;

        state
            .database
            .batch_action("sync_server", server.uuid, {
                let state = state.clone();

                async move {
                    let uuid = server.uuid;

                    match server.0.sync(&state.database).await {
                        Ok(_) => {}
                        Err(err) => {
                            tracing::warn!(server = %uuid, "failed to post server sync: {:#?}", err);
                        }
                    }
                }
            })
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
