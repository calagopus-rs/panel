use super::State;
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{
        admin_activity::AdminActivityLogger,
        user::{AuthMethod, GetAuthMethod, GetUser},
    },
    response::ApiResponse,
};
use std::sync::Arc;
use utoipa_axum::router::OpenApiRouter;

mod activity;
mod backup_configurations;
mod database_hosts;
mod locations;
mod mounts;
mod nests;
mod nodes;
mod roles;
mod servers;
mod settings;
mod users;

pub async fn auth(
    state: GetState,
    ip: shared::GetIp,
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
        user_uuid: user.uuid,
        api_key_uuid: match &*auth {
            AuthMethod::ApiKey(api_key) => Some(api_key.uuid),
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
        .nest(
            "/backup-configurations",
            backup_configurations::router(state),
        )
        .nest("/mounts", mounts::router(state))
        .nest("/users", users::router(state))
        .nest("/roles", roles::router(state))
        .nest("/activity", activity::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            super::client::auth,
        ))
        .with_state(state.clone())
}
