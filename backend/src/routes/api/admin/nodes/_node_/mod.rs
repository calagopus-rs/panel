use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::node::Node,
        routes::{api::client::{GetAuthMethod, GetUser}, ApiError, GetState},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = inline(ApiError)),
        (status = BAD_REQUEST, body = inline(ApiError)),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(node): Path<i32>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let node = match Node::by_id(&state.database, node).await {
            Some(node) => node,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["node not found"])),
                );
            }
        };

        if node.servers > 0 {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["node has servers, cannot delete"])),
            );
        }

        Node::delete_by_id(&state.database, node.id).await;

        user.log_activity(
            &state.database,
            "admin:node.delete",
            ip,
            auth,
            serde_json::json!({
                "name": node.name,
            }),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::{
        models::{location::Location, node::Node},
        routes::{api::client::{GetAuthMethod, GetUser}, ApiError, GetState},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_id: Option<i32>,
        database_host_id: Option<i32>,

        #[validate(length(min = 3, max = 255))]
        name: Option<String>,
        public: Option<bool>,
        #[validate(length(max = 1024))]
        description: Option<String>,

        #[validate(length(min = 3, max = 255))]
        public_host: Option<String>,
        #[validate(length(min = 3, max = 255))]
        host: Option<String>,
        ssl: Option<bool>,
        #[validate(length(min = 3, max = 255))]
        sftp_host: Option<String>,
        sftp_port: Option<u16>,

        #[validate(length(max = 1024))]
        maintenance_message: Option<String>,

        memory: Option<i64>,
        disk: Option<i64>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = inline(ApiError)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(node): Path<i32>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let mut node = match Node::by_id(&state.database, node).await {
            Some(node) => node,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["node not found"])),
                );
            }
        };

        if let Some(location_id) = data.location_id {
            let location = match Location::by_id(&state.database, location_id).await {
                Some(location) => location,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["location not found"])),
                    );
                }
            };

            node.location = location;
        }
        if let Some(database_host_id) = data.database_host_id {
            if database_host_id > 0 {
                let database_host = match crate::models::database_host::DatabaseHost::by_id(
                    &state.database,
                    database_host_id,
                )
                .await
                {
                    Some(db_host) => db_host,
                    None => {
                        return (
                            StatusCode::NOT_FOUND,
                            axum::Json(ApiError::new_value(&["database host not found"])),
                        );
                    }
                };
                node.database_host = Some(database_host);
            } else {
                node.database_host = None;
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
        if let Some(public_host) = data.public_host {
            if public_host.is_empty() {
                node.public_host = None;
            } else {
                node.public_host = Some(public_host);
            }
        }
        if let Some(host) = data.host {
            node.host = host;
        }
        if let Some(ssl) = data.ssl {
            node.ssl = ssl;
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

        if node.save(&state.database).await.is_err() {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&["node with name already exists"])),
            );
        }

        user.log_activity(
            &state.database,
            "admin:node.update",
            ip,
            auth,
            serde_json::json!({
                "name": node.name,
                "public": node.public,
                "description": node.description,
                "public_host": node.public_host,
                "host": node.host,
                "ssl": node.ssl,
                "sftp_host": node.sftp_host,
                "sftp_port": node.sftp_port,
                "memory": node.memory,
                "disk": node.disk,

                "location_id": node.location.id,
                "database_host_id": node.database_host.as_ref().map(|db| db.id),
            }),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
