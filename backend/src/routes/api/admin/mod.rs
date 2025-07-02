use super::{ApiError, State};
use crate::routes::api::client::GetUser;
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};
use utoipa_axum::router::OpenApiRouter;

mod locations;
mod nodes;

pub async fn auth(user: GetUser, req: Request, next: Next) -> Result<Response, StatusCode> {
    if !user.admin {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&["unauthorized access"])).unwrap(),
            ))
            .unwrap());
    }

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/locations", locations::router(state))
        .nest("/nodes", nodes::router(state))
        .route_layer(axum::middleware::from_fn(auth))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            super::client::auth,
        ))
        .with_state(state.clone())
}
