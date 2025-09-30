use super::{GetState, State};
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{models::node::Node, response::ApiResponse};
use utoipa_axum::router::OpenApiRouter;

mod activity;
mod backups;
mod schedule;
pub mod servers;
mod sftp;

pub async fn auth(state: GetState, mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let authorization = match req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
    {
        Some(value) => value,
        None => {
            return Ok(ApiResponse::error("invalid authorization header")
                .with_status(StatusCode::UNAUTHORIZED)
                .into_response());
        }
    };
    let mut parts = authorization.splitn(2, " ");
    let r#type = parts.next().unwrap();
    let token = parts.next();

    if r#type != "Bearer" || token.is_none() || token.unwrap().len() != 81 {
        return Ok(ApiResponse::error("invalid authorization header")
            .with_status(StatusCode::UNAUTHORIZED)
            .into_response());
    }

    let mut parts = token.unwrap().splitn(2, ".");
    let token_id = parts.next().unwrap();
    let token = match parts.next() {
        Some(value) => value,
        None => {
            return Ok(ApiResponse::error("invalid authorization header")
                .with_status(StatusCode::UNAUTHORIZED)
                .into_response());
        }
    };

    let node = Node::by_token_id_token(&state.database, token_id, token).await;
    let node = match node {
        Ok(Some(data)) => data,
        Ok(None) => {
            return Ok(ApiResponse::error("invalid token")
                .with_status(StatusCode::UNAUTHORIZED)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(node);

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/sftp", sftp::router(state))
        .nest("/activity", activity::router(state))
        .nest("/servers", servers::router(state))
        .nest("/backups", backups::router(state))
        .nest("/schedule", schedule::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
