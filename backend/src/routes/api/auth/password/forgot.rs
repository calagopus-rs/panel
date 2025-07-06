use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{user::User, user_password_reset::UserPasswordReset},
        routes::{ApiError, GetState},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
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
        ip: crate::GetIp,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let user = match User::by_email(&state.database, &data.email).await {
            Some(user) => user,
            None => {
                return (
                    StatusCode::OK,
                    axum::Json(serde_json::to_value(Response {}).unwrap()),
                );
            }
        };

        tokio::spawn(async move {
            let token = match UserPasswordReset::create(&state.database, user.id).await {
                Ok(token) => token,
                Err(err) => {
                    tracing::warn!(
                        user = user.id,
                        "failed to create password reset token: {:#?}",
                        err
                    );
                    return;
                }
            };

            let settings = state.settings.get().await;

            let mail = crate::mail::MAIL_PASSWORD_RESET
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

            if let Err(err) = state
                .mail
                .send(
                    &user.email,
                    &format!("{} - Password Reset", settings.app.name),
                    mail,
                )
                .await
            {
                tracing::error!(
                    user = user.id,
                    "failed to send password reset email: {:#?}",
                    err
                );
            }
        });

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
