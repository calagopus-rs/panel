use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::{ApiError, GetState, api::client::GetUser};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        otp_url: String,
        secret: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = CONFLICT, body = inline(ApiError)),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if user.totp_enabled {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&[
                    "two-factor authentication is already enabled",
                ])),
            );
        }

        let secret = match totp_rs::Secret::generate_secret().to_encoded() {
            totp_rs::Secret::Encoded(secret) => secret,
            _ => unreachable!(),
        };

        sqlx::query!(
            "UPDATE users SET totp_secret = $1 WHERE id = $2",
            secret,
            user.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    otp_url: format!(
                        "otpauth://totp/panel-rs:{}?secret={}&issuer=panel-rs",
                        urlencoding::encode(&user.email),
                        urlencoding::encode(&secret),
                    ),
                    secret,
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::user_recovery_code::UserRecoveryCode,
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(equal = 6))]
        #[schema(min_length = 6, max_length = 6)]
        code: String,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        recovery_codes: Vec<String>,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
        (status = UNAUTHORIZED, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if user.totp_enabled {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&[
                    "two-factor authentication is already enabled",
                ])),
            );
        }

        let totp_secret = match &user.totp_secret {
            Some(secret) => secret,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    axum::Json(ApiError::new_value(&[
                        "two-factor authentication has not been configured",
                    ])),
                );
            }
        };

        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if !user
            .validate_password(&state.database, &data.password)
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["invalid password"])),
            );
        }

        let totp = totp_rs::TOTP::new(
            totp_rs::Algorithm::SHA1,
            6,
            1,
            30,
            totp_rs::Secret::Encoded(totp_secret.clone())
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

        let recovery_codes = UserRecoveryCode::create_all(&state.database, user.id)
            .await
            .unwrap();

        sqlx::query!(
            "UPDATE users SET totp_enabled = true WHERE id = $1",
            user.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        user.log_activity(
            &state.database,
            "user:account.two-factor.enable",
            ip,
            auth,
            serde_json::json!({}),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response { recovery_codes }).unwrap()),
        )
    }
}

mod delete {
    use crate::{
        models::user_recovery_code::UserRecoveryCode,
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 6, max = 10))]
        #[schema(min_length = 6, max_length = 10)]
        code: String,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
        (status = UNAUTHORIZED, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        mut user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if !user.totp_enabled {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&[
                    "two-factor authentication is not enabled",
                ])),
            );
        }

        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if !user
            .validate_password(&state.database, &data.password)
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["invalid password"])),
            );
        }

        match data.code.len() {
            6 => {
                let totp = totp_rs::TOTP::new(
                    totp_rs::Algorithm::SHA1,
                    6,
                    1,
                    30,
                    totp_rs::Secret::Encoded(user.0.totp_secret.take().unwrap())
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
                if UserRecoveryCode::delete_by_code(&state.database, user.id, &data.code)
                    .await
                    .is_none()
                {
                    return (
                        StatusCode::BAD_REQUEST,
                        axum::Json(ApiError::new_value(&["invalid recovery code"])),
                    );
                }
            }
            _ => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["invalid confirmation code length"])),
                );
            }
        }

        UserRecoveryCode::delete_by_user_id(&state.database, user.id).await;

        sqlx::query!(
            "UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1",
            user.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        user.log_activity(
            &state.database,
            "user:account.two-factor.disable",
            ip,
            auth,
            serde_json::json!({}),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
