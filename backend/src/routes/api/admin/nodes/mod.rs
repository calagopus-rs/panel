use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _node_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, node::Node},
        routes::{ApiError, GetState},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        nodes: Pagination<crate::models::node::AdminApiNode>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
    ))]
    pub async fn route(
        state: GetState,
        Query(params): Query<PaginationParams>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let nodes = Node::all_with_pagination(&state.database, params.page, params.per_page).await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    nodes: Pagination {
                        total: nodes.total,
                        per_page: nodes.per_page,
                        page: nodes.page,
                        data: nodes
                            .data
                            .into_iter()
                            .map(|node| node.into_admin_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::{database_host::DatabaseHost, location::Location, node::Node},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_id: i32,
        database_host_id: Option<i32>,

        #[validate(length(min = 3, max = 255))]
        name: String,
        public: bool,
        #[validate(length(max = 1024))]
        description: Option<String>,

        #[validate(length(min = 3, max = 255))]
        public_host: Option<String>,
        #[validate(length(min = 3, max = 255))]
        host: String,
        ssl: bool,
        #[validate(length(min = 3, max = 255))]
        sftp_host: Option<String>,
        sftp_port: u16,

        memory: i64,
        disk: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        node: crate::models::node::AdminApiNode,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = NOT_FOUND, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let location = match Location::by_id(&state.database, data.location_id).await {
            Some(location) => location,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["location not found"])),
                );
            }
        };

        let database_host = if let Some(database_host_id) = data.database_host_id {
            match DatabaseHost::by_id(&state.database, database_host_id).await {
                Some(db_host) => Some(db_host),
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["database host not found"])),
                    );
                }
            }
        } else {
            None
        };

        let node = match Node::create(
            &state.database,
            location.id,
            database_host.map(|db_host| db_host.id),
            &data.name,
            data.public,
            data.description.as_deref(),
            data.public_host.as_deref(),
            &data.host,
            data.ssl,
            data.sftp_host.as_deref(),
            data.sftp_port as i32,
            data.memory,
            data.disk,
        )
        .await
        {
            Ok(node_id) => Node::by_id(&state.database, node_id).await.unwrap(),
            Err(_) => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["node with name already exists"])),
                );
            }
        };

        user.log_activity(
            &state.database,
            "admin:node.create",
            ip,
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
                "database_host_id": node.database_host.as_ref().map(|db_host| db_host.id),
            }),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    node: node.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{location}", _node_::router(state))
        .with_state(state.clone())
}
