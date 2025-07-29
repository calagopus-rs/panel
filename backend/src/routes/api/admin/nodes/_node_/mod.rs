use super::State;
use crate::{models::node::Node, response::ApiResponse, routes::GetState};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod allocations;
mod backups;
mod mounts;
mod servers;

pub type GetNode = crate::extract::ConsumingExtension<Node>;

pub async fn auth(
    state: GetState,
    Path(node): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let node = match node.first().map(|s| s.parse::<i32>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid node id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    let node = Node::by_id(&state.database, node).await;
    let node = match node {
        Ok(Some(node)) => node,
        Ok(None) => {
            return Ok(ApiResponse::error("node not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(node);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::nodes::_node_::GetNode},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        node: crate::models::node::AdminApiNode,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ))]
    pub async fn route(state: GetState, node: GetNode) -> ApiResponseResult {
        ApiResponse::json(Response {
            node: node.0.into_admin_api_object(&state.database),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::node::Node,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::nodes::_node_::GetNode, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        activity_logger: GetUserActivityLogger,
    ) -> ApiResponseResult {
        if node.servers > 0 {
            return ApiResponse::error("node has servers, cannot delete")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        Node::delete_by_id(&state.database, node.id).await?;

        activity_logger
            .log(
                "admin:node.delete",
                serde_json::json!({
                    "location_id": node.location.id,
                    "node_id": node.id,

                    "name": node.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::location::Location,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::nodes::_node_::GetNode, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_id: Option<i32>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        public: Option<bool>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        public_url: Option<String>,
        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        url: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        sftp_host: Option<String>,
        sftp_port: Option<u16>,

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        maintenance_message: Option<String>,

        memory: Option<i64>,
        disk: Option<i64>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut node: GetNode,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(location_id) = data.location_id {
            let location = match Location::by_id(&state.database, location_id).await? {
                Some(location) => location,
                None => {
                    return ApiResponse::error("location not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

            node.location = location;
        }
        if let Some(name) = data.name {
            node.name = name;
        }
        if let Some(public) = data.public {
            node.public = public;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                node.description = None;
            } else {
                node.description = Some(description);
            }
        }
        if let Some(public_url) = data.public_url {
            if public_url.is_empty() {
                node.public_url = None;
            } else {
                node.public_url = Some(public_url.parse()?);
            }
        }
        if let Some(url) = data.url {
            node.url = url.parse()?;
        }
        if let Some(sftp_host) = data.sftp_host {
            if sftp_host.is_empty() {
                node.sftp_host = None;
            } else {
                node.sftp_host = Some(sftp_host);
            }
        }
        if let Some(sftp_port) = data.sftp_port {
            node.sftp_port = sftp_port as i32;
        }
        if let Some(maintenance_message) = data.maintenance_message {
            if maintenance_message.is_empty() {
                node.maintenance_message = None;
            } else {
                node.maintenance_message = Some(maintenance_message);
            }
        }
        if let Some(memory) = data.memory {
            node.memory = memory;
        }
        if let Some(disk) = data.disk {
            node.disk = disk;
        }

        match sqlx::query!(
            "UPDATE nodes
            SET location_id = $1, name = $2,
                public = $3, description = $4, public_url = $5,
                url = $6, sftp_host = $7, sftp_port = $8,
                memory = $9, disk = $10
            WHERE id = $11",
            node.location.id,
            node.name,
            node.public,
            node.description,
            node.public_url.as_ref().map(|url| url.to_string()),
            node.url.to_string(),
            node.sftp_host,
            node.sftp_port,
            node.memory,
            node.disk,
            node.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("node with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update node: {:#?}", err);

                return ApiResponse::error("failed to update node")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "admin:node.update",
                serde_json::json!({
                    "node_id": node.id,

                    "name": node.name,
                    "public": node.public,
                    "description": node.description,
                    "public_url": node.public_url,
                    "url": node.url,
                    "sftp_host": node.sftp_host,
                    "sftp_port": node.sftp_port,
                    "memory": node.memory,
                    "disk": node.disk,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/allocations", allocations::router(state))
        .nest("/servers", servers::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/backups", backups::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
