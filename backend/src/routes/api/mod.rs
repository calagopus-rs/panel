use super::{GetState, State};
use axum::{
    http::{HeaderMap, StatusCode},
    routing::get,
};
use utoipa_axum::router::OpenApiRouter;

pub mod admin;
pub mod auth;
pub mod client;
mod languages;
pub mod remote;
mod settings;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .route(
            "/",
            get(|| async move {
                let mut headers = HeaderMap::new();

                headers.insert("Content-Type", "text/html".parse().unwrap());

                (
                    StatusCode::OK,
                    headers,
                    include_str!("../../../static/api.html"),
                )
            }),
        )
        .nest("/settings", settings::router(state))
        .nest("/languages", languages::router(state))
        .nest("/auth", auth::router(state))
        .nest("/client", client::router(state))
        .nest("/admin", admin::router(state))
        .nest("/remote", remote::router(state))
        .with_state(state.clone())
}
