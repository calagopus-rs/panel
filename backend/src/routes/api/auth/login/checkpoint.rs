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
        code: String,
        confirmation_token: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: ApiUser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        headers: axum::http::HeaderMap,
        cookies: Cookies,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let payload = match state
            .jwt
            .verify::<TwoFactorRequiredJwt>(&data.confirmation_token)
        {
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
            }
            10 => {
                if let Some(code) =
                    UserRecoveryCode::delete_by_code(&state.database, payload.user_id, &data.code)
                        .await
                {
                    // TODO
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
            crate::utils::extract_ip(&headers).unwrap().into(),
            headers
                .get("User-Agent")
                .map(|ua| crate::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                .unwrap_or("unknown"),
        )
        .await;

        cookies.add(
            Cookie::build(("session", key))
                .http_only(true)
                .same_site(tower_cookies::cookie::SameSite::Strict)
                .secure(true)
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
