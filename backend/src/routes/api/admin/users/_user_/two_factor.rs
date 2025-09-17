use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_recovery_code::UserRecoveryCode,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, users::_user_::GetParamUser},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = CONFLICT, body = ApiError),
    ))]
    pub async fn route(
        state: GetState,
        user: GetParamUser,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        if !user.totp_enabled {
            return ApiResponse::error("two-factor authentication is not enabled")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        UserRecoveryCode::delete_by_user_uuid(&state.database, user.uuid).await?;

        sqlx::query!(
            "UPDATE users
            SET totp_enabled = false, totp_secret = NULL
            WHERE users.uuid = $1",
            user.uuid
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log("user:two-factor.disable", serde_json::json!({}))
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
