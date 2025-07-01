use super::{ApiError, GetState, State};
use axum::{
    http::{HeaderMap, StatusCode},
    routing::get,
};
use utoipa_axum::router::OpenApiRouter;

mod auth;
mod client;

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
        .nest("/auth", auth::router(state))
        .nest("/client", client::router(state))
        .with_state(state.clone())
}
