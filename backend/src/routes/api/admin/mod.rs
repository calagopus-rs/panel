use super::State;
use crate::{
    response::ApiResponse,
    routes::{
        GetState,
        api::client::{AuthMethod, GetAuthMethod, GetUser},
    },
};
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::sync::Arc;
use utoipa_axum::router::OpenApiRouter;

mod activity;
mod database_hosts;
mod locations;
mod mounts;
mod nests;
mod nodes;
mod servers;
mod settings;
mod users;

pub type GetAdminActivityLogger = crate::extract::ConsumingExtension<AdminActivityLogger>;

#[derive(Clone)]
pub struct AdminActivityLogger {
    state: State,
    user_id: i32,
    api_key_id: Option<i32>,
    ip: std::net::IpAddr,
}

impl AdminActivityLogger {
    pub async fn log(&self, event: &str, data: serde_json::Value) {
        if let Err(err) = crate::models::admin_activity::AdminActivity::log(
            &self.state.database,
            Some(self.user_id),
            self.api_key_id,
            event,
            Some(self.ip.into()),
            data,
        )
        .await
        {
            tracing::warn!(
                user = self.user_id,
                "failed to log admin activity: {:#?}",
                err
            );
        }
    }
}

pub async fn auth(
    state: GetState,
    ip: crate::GetIp,
    user: GetUser,
    auth: GetAuthMethod,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if !user.admin {
        return Ok(ApiResponse::error("unauthorized")
            .with_status(StatusCode::UNAUTHORIZED)
            .into_response());
    }

    req.extensions_mut().insert(AdminActivityLogger {
        state: Arc::clone(&state),
        user_id: user.id,
        api_key_id: match &*auth {
            AuthMethod::ApiKey(api_key) => Some(api_key.id),
            AuthMethod::Session(_) => None,
        },
        ip: ip.0,
    });
    req.extensions_mut().insert(user.0);
    req.extensions_mut().insert(auth.0);

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/settings", settings::router(state))
        .nest("/locations", locations::router(state))
        .nest("/servers", servers::router(state))
        .nest("/nodes", nodes::router(state))
        .nest("/nests", nests::router(state))
        .nest("/database-hosts", database_hosts::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/users", users::router(state))
        .nest("/activity", activity::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            super::client::auth,
        ))
        .with_state(state.clone())
}
