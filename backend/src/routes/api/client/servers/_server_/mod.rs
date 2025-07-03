use super::State;
use crate::{
    GetIp,
    models::server::Server,
    routes::{
        ApiError, GetState,
        api::client::{GetAuthMethod, GetUser},
    },
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

mod activity;
mod command;
mod files;
mod power;
mod resources;

pub type GetServer = crate::extract::ConsumingExtension<Server>;
pub type GetServerActivityLogger = crate::extract::ConsumingExtension<ServerActivityLogger>;

#[derive(Clone)]
pub struct ServerActivityLogger {
    state: State,
    server_id: i32,
    user_id: i32,
    api_key_id: Option<i32>,
    ip: std::net::IpAddr,
}

impl ServerActivityLogger {
    pub async fn log(&self, event: &str, data: serde_json::Value) {
        if let Err(err) = crate::models::server_activity::ServerActivity::log(
            &self.state.database,
            self.server_id,
            self.user_id,
            self.api_key_id,
            event,
            self.ip.into(),
            data,
        )
        .await
        {
            tracing::warn!(
                user = self.user_id,
                "failed to log server activity: {:#?}",
                err
            );
        }
    }
}

pub async fn auth(
    state: GetState,
    user: GetUser,
    auth: GetAuthMethod,
    ip: GetIp,
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

    req.extensions_mut().insert(ServerActivityLogger {
        state: Arc::clone(&state),
        server_id: server.id,
        user_id: user.id,
        api_key_id: match auth.0 {
            crate::routes::api::client::AuthMethod::ApiKey(api_key) => Some(api_key.id),
            _ => None,
        },
        ip: ip.0,
    });
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
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
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
        .nest("/activity", activity::router(state))
        .nest("/resources", resources::router(state))
        .nest("/command", command::router(state))
        .nest("/power", power::router(state))
        .nest("/files", files::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
