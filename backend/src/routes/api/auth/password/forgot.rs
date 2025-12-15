use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::{HeaderMap, StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{user::User, user_activity::UserActivity, user_password_reset::UserPasswordReset},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(email)]
        #[schema(format = "email")]
        email: String,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: shared::GetIp,
        headers: HeaderMap,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let user = match User::by_email(&state.database, &data.email).await? {
            Some(user) => user,
            None => return ApiResponse::json(Response {}).ok(),
        };

        tokio::spawn(async move {
            let token = match UserPasswordReset::create(&state.database, user.uuid).await {
                Ok(token) => token,
                Err(err) => {
                    tracing::warn!(
                        user = %user.uuid,
                        "failed to create password reset token: {:#?}",
                        err
                    );
                    return;
                }
            };

            let settings = state.settings.get().await;

            let mail = shared::mail::MAIL_PASSWORD_RESET
                .replace("{{app_name}}", &settings.app.name)
                .replace("{{user_username}}", &user.username)
                .replace(
                    "{{reset_link}}",
                    &format!(
                        "{}/auth/reset-password?token={}",
                        settings.app.url,
                        urlencoding::encode(&token),
                    ),
                );

            UserActivity::log(
                &state.database,
                user.uuid,
                None,
                "email:password-reset",
                Some(ip.0.into()),
                serde_json::json!({
                    "user_agent": headers
                        .get("User-Agent")
                        .map(|ua| shared::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                        .unwrap_or("unknown"),
                }),
            )
            .await
            .ok();

            state
                .mail
                .send(
                    user.email,
                    format!("{} - Password Reset", settings.app.name).into(),
                    mail,
                )
                .await;
        });

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
