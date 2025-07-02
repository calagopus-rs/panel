use super::State;
use crate::{
    models::server::Server,
    routes::{ApiError, GetState, api::client::GetUser},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

pub type GetServer = crate::extract::ConsumingExtension<Server>;

pub async fn auth(
    state: GetState,
    user: GetUser,
    Path(server): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let server = Server::by_user_id_identifier(&state.database, user.id, &server[0]).await;
    let server = match server {
        Some(server) => server,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["server not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(user.0);
    req.extensions_mut().insert(server);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::client::servers::_server_::GetServer;
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: crate::models::server::ApiServer,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = uuid::Uuid, Query,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        )
    ))]
    pub async fn route(server: GetServer) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    server: server.0.into_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        //.nest("/{server}", _server_::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
