use super::State;
use crate::{
    models::server::Server,
    routes::{ApiError, GetState, api::remote::GetNode},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod install;

pub type GetServer = crate::extract::ConsumingExtension<Server>;

pub async fn auth(
    state: GetState,
    node: GetNode,
    Path(server): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let server = Server::by_node_id_uuid(&state.database, node.id, server).await;
    let server = match server {
        Some(server) => server,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["server not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(server);
    req.extensions_mut().insert(node.0);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{GetState, api::remote::servers::_server_::GetServer};
    use axum::http::StatusCode;

    type Response = crate::models::server::RemoteApiServer;

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(server.0.into_remote_api_object(&state.database).await)
                    .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/install", install::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
