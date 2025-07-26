use super::State;
use crate::jwt::BasePayload;
use serde::{Deserialize, Serialize};
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Deserialize, Serialize)]
pub struct TwoFactorRequiredJwt {
    #[serde(flatten)]
    pub base: BasePayload,

    pub user_id: i32,
    pub user_totp_secret: String,
}

mod post {
    use crate::{
        models::{
            user::{ApiUser, User},
            user_activity::UserActivity,
            user_recovery_code::UserRecoveryCode,
            user_session::UserSession,
        },
        routes::{ApiError, GetState, api::auth::login::checkpoint::TwoFactorRequiredJwt},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 6, max = 10))]
        #[schema(min_length = 6, max_length = 10)]
        code: String,
        confirmation_token: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: ApiUser,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let payload: TwoFactorRequiredJwt = match state.jwt.verify(&data.confirmation_token) {
            Ok(payload) => payload,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["invalid confirmation token"])),
                );
            }
        };

        if !payload.base.validate() {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["invalid confirmation token"])),
            );
        }

        match data.code.len() {
            6 => {
                let totp = totp_rs::TOTP::new(
                    totp_rs::Algorithm::SHA1,
                    6,
                    1,
                    30,
                    totp_rs::Secret::Encoded(payload.user_totp_secret)
                        .to_bytes()
                        .unwrap(),
                )
                .unwrap();

                if !totp.check_current(&data.code).is_ok_and(|valid| valid) {
                    return (
                        StatusCode::BAD_REQUEST,
                        axum::Json(ApiError::new_value(&["invalid confirmation code"])),
                    );
                }

                if let Err(err) = UserActivity::log(
                    &state.database,
                    payload.user_id,
                    None,
                    "auth:success",
                    ip.0.into(),
                    serde_json::json!({
                        "using": "two_factor",
                    }),
                )
                .await
                {
                    tracing::warn!(
                        user = payload.user_id,
                        "failed to log user activity: {:#?}",
                        err
                    );
                }
            }
            10 => {
                if let Some(code) =
                    UserRecoveryCode::delete_by_code(&state.database, payload.user_id, &data.code)
                        .await
                {
                    if let Err(err) = UserActivity::log(
                        &state.database,
                        payload.user_id,
                        None,
                        "auth:success",
                        ip.0.into(),
                        serde_json::json!({
                            "using": "recovery_code",
                            "code": code,
                        }),
                    )
                    .await
                    {
                        tracing::warn!(
                            user = payload.user_id,
                            "failed to log user activity: {:#?}",
                            err
                        );
                    }
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        axum::Json(ApiError::new_value(&["invalid recovery code"])),
                    );
                }
            }
            _ => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["invalid confirmation code"])),
                );
            }
        }

        let user = match User::by_id(&state.database, payload.user_id).await {
            Some(user) => user,
            None => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["user not found"])),
                );
            }
        };

        let key = UserSession::create(
            &state.database,
            user.id,
            ip.0.into(),
            headers
                .get("User-Agent")
                .map(|ua| crate::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                .unwrap_or("unknown"),
        )
        .await;

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

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    user: user.into_api_object(true),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
