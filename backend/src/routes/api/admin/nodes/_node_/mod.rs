use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, node::Node, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod allocations;
mod backups;
mod mounts;
mod reset_token;
mod servers;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(node): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let node = match node.first().map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid node uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("nodes.read") {
        return Ok(err.into_response());
    }

    let node = Node::by_uuid_optional(&state.database, node).await;
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
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{node::GetNode, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        node: shared::models::node::AdminApiNode,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        node: GetNode,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("nodes.read")?;

        ApiResponse::json(Response {
            node: node.0.into_admin_api_object(&state.database).await?,
        })
        .ok()
    }
}

mod delete {
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, node::GetNode, server::Server,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("nodes.delete")?;

        if Server::count_by_node_uuid(&state.database, node.uuid).await > 0 {
            return ApiResponse::error("node has servers, cannot delete")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        node.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "node:delete",
                serde_json::json!({
                    "uuid": node.uuid,
                    "name": node.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use axum::http::StatusCode;
    use compact_str::ToCompactString;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger,
            backup_configurations::BackupConfiguration, location::Location, node::GetNode,
            user::GetPermissionManager,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_uuid: Option<uuid::Uuid>,
        backup_configuration_uuid: Option<uuid::Uuid>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        public: Option<bool>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        public_url: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        url: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        sftp_host: Option<compact_str::CompactString>,
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
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut node: GetNode,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("nodes.update")?;

        if let Some(location_uuid) = data.location_uuid {
            let location = match Location::by_uuid_optional(&state.database, location_uuid).await? {
                Some(location) => location,
                None => {
                    return ApiResponse::error("location not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

            node.location = location;
        }
        if let Some(backup_configuration_uuid) = data.backup_configuration_uuid {
            if backup_configuration_uuid.is_nil() {
                node.backup_configuration = None;
            } else {
                let backup_configuration = match BackupConfiguration::by_uuid_optional(
                    &state.database,
                    backup_configuration_uuid,
                )
                .await?
                {
                    Some(backup_configuration) => backup_configuration,
                    None => {
                        return ApiResponse::error("backup configuration not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }
                };

                node.backup_configuration = Some(BackupConfiguration::get_fetchable(
                    backup_configuration.uuid,
                ));
            }
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
            SET location_uuid = $1, backup_configuration_uuid = $2, name = $3,
                public = $4, description = $5, public_url = $6,
                url = $7, sftp_host = $8, sftp_port = $9,
                maintenance_message = $10, memory = $11, disk = $12
            WHERE nodes.uuid = $13",
            node.location.uuid,
            node.backup_configuration
                .as_ref()
                .map(|backup_configuration| backup_configuration.uuid),
            &node.name,
            node.public,
            node.description.as_deref(),
            node.public_url.as_ref().map(|url| url.to_string()),
            &node.url.to_compact_string(),
            node.sftp_host.as_deref(),
            node.sftp_port,
            node.maintenance_message,
            node.memory,
            node.disk,
            node.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("node with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update node: {:?}", err);

                return ApiResponse::error("failed to update node")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "node:update",
                serde_json::json!({
                    "uuid": node.uuid,
                    "location_uuid": node.location.uuid,

                    "name": node.name,
                    "public": node.public,
                    "description": node.description,
                    "public_url": node.public_url,
                    "url": node.url,
                    "sftp_host": node.sftp_host,
                    "sftp_port": node.sftp_port,
                    "maintenance_message": node.maintenance_message,
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
        .nest("/reset-token", reset_token::router(state))
        .nest("/allocations", allocations::router(state))
        .nest("/servers", servers::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/backups", backups::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
