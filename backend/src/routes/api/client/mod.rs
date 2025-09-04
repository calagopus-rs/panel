use super::{GetState, State};
use crate::{
    models::{user::User, user_api_key::UserApiKey, user_session::UserSession},
    response::ApiResponse,
};
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::sync::Arc;
use tower_cookies::{Cookie, Cookies};
use utoipa_axum::router::OpenApiRouter;

mod account;
mod permissions;
mod servers;

#[derive(Clone)]
pub enum AuthMethod {
    Session(UserSession),
    ApiKey(UserApiKey),
}

pub type GetUser = crate::extract::ConsumingExtension<User>;
pub type GetAuthMethod = crate::extract::ConsumingExtension<AuthMethod>;
pub type GetUserActivityLogger = crate::extract::ConsumingExtension<UserActivityLogger>;

#[derive(Clone)]
pub struct UserActivityLogger {
    state: State,
    user_uuid: uuid::Uuid,
    api_key_uuid: Option<uuid::Uuid>,
    ip: std::net::IpAddr,
}

impl UserActivityLogger {
    pub async fn log(&self, event: &str, data: serde_json::Value) {
        if let Err(err) = crate::models::user_activity::UserActivity::log(
            &self.state.database,
            self.user_uuid,
            self.api_key_uuid,
            event,
            self.ip.into(),
            data,
        )
        .await
        {
            tracing::warn!(
                user = %self.user_uuid,
                "failed to log user activity: {:#?}",
                err
            );
        }
    }
}

pub async fn auth(
    state: GetState,
    ip: crate::GetIp,
    cookies: Cookies,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = state
        .cache
        .ratelimit("client", 720, 60, ip.to_string())
        .await
    {
        return Ok(err.into_response());
    }

    if let Some(session_id) = cookies.get("session") {
        if session_id.value().len() != 81 {
            return Ok(ApiResponse::error("invalid authorization cookie")
                .with_status(StatusCode::UNAUTHORIZED)
                .into_response());
        }

        let user = User::by_session(&state.database, session_id.value()).await;
        let (user, session) = match user {
            Ok(Some(data)) => data,
            Ok(None) => {
                return Ok(ApiResponse::error("invalid session")
                    .with_status(StatusCode::UNAUTHORIZED)
                    .into_response());
            }
            Err(err) => return Ok(ApiResponse::from(err).into_response()),
        };

        state
            .database
            .batch_action("update_user_session", session.uuid, {
                let state = state.clone();
                let user_agent = crate::utils::slice_up_to(
                    req.headers()
                        .get("User-Agent")
                        .and_then(|ua| ua.to_str().ok())
                        .unwrap_or("unknown"),
                    255,
                )
                .to_string();

                async move {
                    if let Err(err) = sqlx::query!(
                        "UPDATE user_sessions
                        SET ip = $1, user_agent = $2, last_used = NOW()
                        WHERE user_sessions.uuid = $3",
                        sqlx::types::ipnetwork::IpNetwork::from(ip.0),
                        user_agent,
                        session.uuid,
                    )
                    .execute(state.database.write())
                    .await
                    {
                        tracing::warn!(user = %user.uuid, "failed to update user session: {:#?}", err);
                        sentry::capture_error(&err);
                    }
                }
            })
            .await;

        cookies.add(
            Cookie::build(("session", session_id.value().to_string()))
                .http_only(true)
                .same_site(tower_cookies::cookie::SameSite::Lax)
                .secure(true)
                .path("/")
                .expires(
                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                        + tower_cookies::cookie::time::Duration::days(30),
                )
                .build(),
        );

        req.extensions_mut().insert(UserActivityLogger {
            state: Arc::clone(&state),
            user_uuid: user.uuid,
            api_key_uuid: None,
            ip: ip.0,
        });
        req.extensions_mut().insert(user);
        req.extensions_mut().insert(AuthMethod::Session(session));
    } else if let Some(api_token) = req.headers().get("Authorization") {
        if api_token.len() != 55 {
            return Ok(ApiResponse::error("invalid authorization header")
                .with_status(StatusCode::UNAUTHORIZED)
                .into_response());
        }

        let user = User::by_api_key(
            &state.database,
            api_token
                .to_str()
                .unwrap_or("")
                .trim_start_matches("Bearer "),
        )
        .await;
        let (user, api_key) = match user {
            Ok(Some(data)) => data,
            Ok(None) => {
                return Ok(ApiResponse::error("invalid api key")
                    .with_status(StatusCode::UNAUTHORIZED)
                    .into_response());
            }
            Err(err) => return Ok(ApiResponse::from(err).into_response()),
        };

        state
            .database
            .batch_action("update_user_api_key", api_key.uuid, {
                let state = state.clone();

                async move {
                    if let Err(err) = sqlx::query!(
                        "UPDATE user_api_keys
                        SET last_used = NOW()
                        WHERE user_api_keys.uuid = $1",
                        api_key.uuid,
                    )
                    .execute(state.database.write())
                    .await
                    {
                        tracing::warn!(user = %user.uuid, "failed to update api key: {:#?}", err);
                    }
                }
            })
            .await;

        req.extensions_mut().insert(UserActivityLogger {
            state: Arc::clone(&state),
            user_uuid: user.uuid,
            api_key_uuid: Some(api_key.uuid),
            ip: ip.0,
        });
        req.extensions_mut().insert(user);
        req.extensions_mut().insert(AuthMethod::ApiKey(api_key));
    } else {
        return Ok(ApiResponse::error("missing authorization")
            .with_status(StatusCode::UNAUTHORIZED)
            .into_response());
    }

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/account", account::router(state))
        .nest("/servers", servers::router(state))
        .nest("/permissions", permissions::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
