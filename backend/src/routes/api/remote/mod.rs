use super::{ApiError, GetState, State};
use crate::models::node::Node;
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};
use utoipa_axum::router::OpenApiRouter;

mod servers;
mod sftp;

pub type GetNode = crate::extract::ConsumingExtension<Node>;

pub async fn auth(state: GetState, mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let authorization = match req
        .headers()
        .get("Authorization")
        .map(|h| h.to_str().ok())
        .flatten()
    {
        Some(value) => value,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid authorization header"]))
                        .unwrap(),
                ))
                .unwrap());
        }
    };
    let mut parts = authorization.splitn(2, " ");
    let r#type = parts.next().unwrap();
    let token = parts.next();

    if r#type != "Bearer" || token.is_none() || token.unwrap().len() != 81 {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&["invalid authorization header"]))
                    .unwrap(),
            ))
            .unwrap());
    }

    let mut parts = token.unwrap().splitn(2, ".");
    let token_id = parts.next().unwrap();
    let token = match parts.next() {
        Some(value) => value,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid authorization header"]))
                        .unwrap(),
                ))
                .unwrap());
        }
    };

    let node = Node::by_token_id_token(&state.database, token_id, token).await;
    let node = match node {
        Some(data) => data,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid token"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(node);

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/sftp", sftp::router(state))
        .nest("/servers", servers::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
