use super::{GetState, State};
use crate::{
    models::{user::User, user_api_key::UserApiKey, user_session::UserSession},
    response::ApiResponse,
};
use axum::{
    body::Body,
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
pub type GetPermissionManager = crate::extract::ConsumingExtension<PermissionManager>;
pub type GetUserActivityLogger = axum::extract::Extension<UserActivityLogger>;

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

#[derive(Clone)]
pub struct PermissionManager {
    user_admin: bool,
    role_admin_permissions: Option<Arc<Vec<String>>>,
    role_server_permissions: Option<Arc<Vec<String>>>,
    api_key_user_permissions: Option<Arc<Vec<String>>>,
    api_key_admin_permissions: Option<Arc<Vec<String>>>,
    api_key_server_permissions: Option<Arc<Vec<String>>>,
    server_subuser_permissions: Option<Arc<Vec<String>>>,
}

impl PermissionManager {
    pub fn new(user: &User) -> Self {
        Self {
            user_admin: user.admin,
            role_admin_permissions: user.role.as_ref().map(|r| r.admin_permissions.clone()),
            role_server_permissions: user.role.as_ref().map(|r| r.server_permissions.clone()),
            api_key_user_permissions: None,
            api_key_admin_permissions: None,
            api_key_server_permissions: None,
            server_subuser_permissions: None,
        }
    }

    pub fn add_api_key(mut self, api_key: &UserApiKey) -> Self {
        self.api_key_user_permissions = Some(api_key.user_permissions.clone());
        self.api_key_admin_permissions = Some(api_key.admin_permissions.clone());
        self.api_key_server_permissions = Some(api_key.server_permissions.clone());

        self
    }

    pub fn add_subuser_permissions(mut self, permissions: Option<Arc<Vec<String>>>) -> Self {
        self.server_subuser_permissions = permissions;

        self
    }

    pub fn has_user_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if let Some(permissions) = &self.api_key_user_permissions {
            if permissions.iter().any(|p| p == permission) {
                return Ok(());
            } else {
                return Err(ApiResponse::new(Body::from(format!(
                    "you do not have permission to perform this action: {permission}"
                )))
                .with_status(StatusCode::FORBIDDEN));
            }
        }

        Ok(())
    }

    pub fn has_admin_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if self.user_admin {
            return Ok(());
        }

        let has_role_permission = if let Some(permissions) = &self.role_admin_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        if !has_role_permission {
            return Err(ApiResponse::new(Body::from(format!(
                "you do not have permission to perform this action: {permission}"
            )))
            .with_status(StatusCode::FORBIDDEN));
        }

        if let Some(permissions) = &self.api_key_admin_permissions
            && !permissions.iter().any(|p| p == permission)
        {
            return Err(ApiResponse::new(Body::from(format!(
                "you do not have permission to perform this action: {permission}"
            )))
            .with_status(StatusCode::FORBIDDEN));
        }

        Ok(())
    }

    pub fn has_server_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if self.user_admin {
            return Ok(());
        }

        if self.server_subuser_permissions.is_none() && self.role_server_permissions.is_none() {
            if let Some(api_key_permissions) = &self.api_key_server_permissions
                && api_key_permissions.iter().any(|p| p == permission)
            {
                return Ok(());
            }

            return Err(ApiResponse::new(Body::from(format!(
                "you do not have permission to perform this action: {permission}"
            )))
            .with_status(StatusCode::FORBIDDEN));
        }

        let has_role_permission = if let Some(permissions) = &self.role_server_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        let has_subuser_permission = if let Some(permissions) = &self.server_subuser_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        let has_base_permission = has_role_permission || has_subuser_permission;

        if !has_base_permission {
            return Err(ApiResponse::new(Body::from(format!(
                "you do not have permission to perform this action: {permission}"
            )))
            .with_status(StatusCode::FORBIDDEN));
        }

        if let Some(api_key_permissions) = &self.api_key_server_permissions
            && !api_key_permissions.iter().any(|p| p == permission)
        {
            return Err(ApiResponse::new(Body::from(format!(
                "you do not have permission to perform this action: {permission}"
            )))
            .with_status(StatusCode::FORBIDDEN));
        }

        Ok(())
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

        req.extensions_mut().insert(PermissionManager::new(&user));
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

        req.extensions_mut()
            .insert(PermissionManager::new(&user).add_api_key(&api_key));
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
