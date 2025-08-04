use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod checkpoint;

mod post {
    use crate::{
        jwt::BasePayload,
        models::{
            user::{ApiUser, User},
            user_activity::UserActivity,
            user_session::UserSession,
        },
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::auth::login::checkpoint::TwoFactorRequiredJwt},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        user: String,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        password: String,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    #[serde(tag = "type", rename_all = "snake_case")]
    enum Response {
        Completed { user: ApiUser },
        TwoFactorRequired { token: String },
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        headers: axum::http::HeaderMap,
        cookies: Cookies,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let user = if data.user.contains('@') {
            match User::by_email_password(&state.database, &data.user, &data.password).await? {
                Some(user) => user,
                None => {
                    return ApiResponse::error("invalid username or password")
                        .with_status(StatusCode::BAD_REQUEST)
                        .ok();
                }
            }
        } else {
            match User::by_username_password(&state.database, &data.user, &data.password).await? {
                Some(user) => user,
                None => {
                    return ApiResponse::error("invalid username or password")
                        .with_status(StatusCode::BAD_REQUEST)
                        .ok();
                }
            }
        };

        if user.totp_enabled && user.totp_secret.is_some() {
            let secret = user.totp_secret.as_ref().unwrap();
            let token = state
                .jwt
                .create(&TwoFactorRequiredJwt {
                    base: BasePayload {
                        issuer: "panel".into(),
                        subject: None,
                        audience: Vec::new(),
                        expiration_time: Some(chrono::Utc::now().timestamp() + 300),
                        not_before: None,
                        issued_at: Some(chrono::Utc::now().timestamp()),
                        jwt_id: user.id.to_string(),
                    },
                    user_id: user.id,
                    user_totp_secret: secret.clone(),
                })
                .unwrap();

            if let Err(err) = UserActivity::log(
                &state.database,
                user.id,
                None,
                "auth:checkpoint",
                ip.0.into(),
                serde_json::json!({}),
            )
            .await
            {
                tracing::warn!(user = user.id, "failed to log user activity: {:#?}", err);
            }

            ApiResponse::json(Response::TwoFactorRequired { token }).ok()
        } else {
            let key = UserSession::create(
                &state.database,
                user.id,
                ip.0.into(),
                headers
                    .get("User-Agent")
                    .map(|ua| crate::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                    .unwrap_or("unknown"),
            )
            .await?;

            let settings = state.settings.get().await;

            cookies.add(
                Cookie::build(("session", key))
                    .http_only(true)
                    .same_site(tower_cookies::cookie::SameSite::Strict)
                    .secure(settings.app.url.starts_with("https://"))
                    .path("/")
                    .expires(
                        tower_cookies::cookie::time::OffsetDateTime::now_utc()
                            + tower_cookies::cookie::time::Duration::days(30),
                    )
                    .build(),
            );

            if let Err(err) = UserActivity::log(
                &state.database,
                user.id,
                None,
                "auth:success",
                ip.0.into(),
                serde_json::json!({
                    "using": "password",
                }),
            )
            .await
            {
                tracing::warn!(user = user.id, "failed to log user activity: {:#?}", err);
            }

            ApiResponse::json(Response::Completed {
                user: user.into_api_object(true),
            })
            .ok()
        }
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .nest("/checkpoint", checkpoint::router(state))
        .with_state(state.clone())
}
