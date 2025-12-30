use super::State;
use serde::{Deserialize, Serialize};
use shared::jwt::BasePayload;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Deserialize, Serialize)]
pub struct TwoFactorRequiredJwt {
    #[serde(flatten)]
    pub base: BasePayload,

    pub user_uuid: uuid::Uuid,
    pub user_totp_secret: String,
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, user::User, user_activity::UserActivity, user_recovery_code::UserRecoveryCode,
            user_session::UserSession,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;
    use validator::Validate;

    use crate::routes::api::auth::login::checkpoint::TwoFactorRequiredJwt;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 6, max = 10))]
        #[schema(min_length = 6, max_length = 10)]
        code: String,

        confirmation_token: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: shared::models::user::ApiFullUser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: shared::GetIp,
        headers: axum::http::HeaderMap,
        cookies: Cookies,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let payload: TwoFactorRequiredJwt = match state.jwt.verify(&data.confirmation_token) {
            Ok(payload) => payload,
            Err(_) => {
                return ApiResponse::error("invalid confirmation token")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        if !payload.base.validate() {
            return ApiResponse::error("invalid confirmation token")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        match data.code.len() {
            6 => {
                let totp = totp_rs::TOTP::new(
                    totp_rs::Algorithm::SHA1,
                    6,
                    1,
                    30,
                    totp_rs::Secret::Encoded(payload.user_totp_secret).to_bytes()?,
                )?;

                if !totp.check_current(&data.code).is_ok_and(|valid| valid) {
                    return ApiResponse::error("invalid confirmation code")
                        .with_status(StatusCode::BAD_REQUEST)
                        .ok();
                }

                if let Err(err) = UserActivity::log(
                    &state.database,
                    payload.user_uuid,
                    None,
                    "auth:success",
                    Some(ip.0.into()),
                    serde_json::json!({
                        "using": "two_factor",
                    }),
                )
                .await
                {
                    tracing::warn!(
                        user = %payload.user_uuid,
                        "failed to log user activity: {:#?}",
                        err
                    );
                }
            }
            10 => {
                if let Some(code) = UserRecoveryCode::delete_by_user_uuid_code(
                    &state.database,
                    payload.user_uuid,
                    &data.code,
                )
                .await?
                {
                    if let Err(err) = UserActivity::log(
                        &state.database,
                        payload.user_uuid,
                        None,
                        "auth:success",
                        Some(ip.0.into()),
                        serde_json::json!({
                            "using": "recovery_code",
                            "code": code,
                        }),
                    )
                    .await
                    {
                        tracing::warn!(
                            user = %payload.user_uuid,
                            "failed to log user activity: {:#?}",
                            err
                        );
                    }
                } else {
                    return ApiResponse::error("invalid recovery code")
                        .with_status(StatusCode::BAD_REQUEST)
                        .ok();
                }
            }
            _ => {
                return ApiResponse::error("invalid confirmation code")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        }

        let user = User::by_uuid(&state.database, payload.user_uuid).await?;

        let key = UserSession::create(
            &state.database,
            user.uuid,
            ip.0.into(),
            headers
                .get("User-Agent")
                .map(|ua| shared::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                .unwrap_or("unknown"),
        )
        .await?;

        sqlx::query!(
            "UPDATE users
            SET totp_last_used = NOW()
            WHERE users.uuid = $1",
            user.uuid
        )
        .execute(state.database.write())
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

        ApiResponse::json(Response {
            user: user.into_api_full_object(&state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
