use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{user_activity::UserActivity, user_password_reset::UserPasswordReset},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 96, max = 96))]
        #[schema(min_length = 96, max_length = 96)]
        token: String,
        #[validate(length(min = 8, max = 512))]
        #[schema(min_length = 8, max_length = 512)]
        new_password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let token = match UserPasswordReset::delete_by_token(&state.database, &data.token).await? {
            Some(token) => token,
            None => {
                return ApiResponse::error("invalid or expired token")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        if let Err(err) = UserActivity::log(
            &state.database,
            token.user.id,
            None,
            "auth:reset-password",
            ip.0.into(),
            serde_json::json!({}),
        )
        .await
        {
            tracing::warn!(
                user = token.user.id,
                "failed to log user activity: {:#?}",
                err
            );
        }

        token
            .user
            .update_password(&state.database, &data.new_password)
            .await?;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
