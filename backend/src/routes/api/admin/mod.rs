use super::{ApiError, State};
use crate::routes::api::client::GetUser;
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};
use utoipa_axum::router::OpenApiRouter;

mod database_hosts;
mod locations;
mod mounts;
mod nests;
mod nodes;
mod servers;
mod settings;
mod users;

pub async fn auth(user: GetUser, mut req: Request, next: Next) -> Result<Response, StatusCode> {
    if !user.admin {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&["unauthorized access"])).unwrap(),
            ))
            .unwrap());
    }

    req.extensions_mut().insert(user.0);

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
        .route_layer(axum::middleware::from_fn(auth))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            super::client::auth,
        ))
        .with_state(state.clone())
}
