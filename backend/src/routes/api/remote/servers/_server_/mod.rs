use super::State;
use crate::{
    models::server::Server,
    response::ApiResponse,
    routes::{GetState, api::remote::GetNode},
};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod backups;
mod install;
mod startup;
mod transfer;

pub type GetServer = crate::extract::ConsumingExtension<Server>;

pub async fn auth(
    state: GetState,
    node: GetNode,
    Path(server): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let server = match server.first().map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid server id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    let server = Server::by_node_uuid_uuid(&state.database, node.uuid, server).await;
    let server = match server {
        Ok(Some(server)) => server,
        Ok(None) => {
            return Ok(ApiResponse::error("server not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(server);
    req.extensions_mut().insert(node.0);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{GetState, api::remote::servers::_server_::GetServer},
    };

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = crate::models::server::RemoteApiServer),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(state: GetState, server: GetServer) -> ApiResponseResult {
        ApiResponse::json(server.0.into_remote_api_object(&state.database).await?).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/install", install::router(state))
        .nest("/transfer", transfer::router(state))
        .nest("/backups", backups::router(state))
        .nest("/startup", startup::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
