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
        #[schema(inline)]
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
        models::{location::Location, node::Node},
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_id: i32,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: String,
        public: bool,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        public_url: Option<String>,
        #[validate(length(min = 3, max = 255), url)]
        #[schema(min_length = 3, max_length = 255, format = "uri")]
        url: String,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
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
        (status = BAD_REQUEST, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
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

        let node = match Node::create(
            &state.database,
            location.id,
            &data.name,
            data.public,
            data.description.as_deref(),
            data.public_url.as_deref(),
            &data.url,
            data.sftp_host.as_deref(),
            data.sftp_port as i32,
            data.memory,
            data.disk,
        )
        .await
        {
            Ok(node_id) => Node::by_id(&state.database, node_id).await.unwrap(),
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["node with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to create node: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to create node"])),
                );
            }
        };

        user.log_activity(
            &state.database,
            "admin:node.create",
            ip,
            auth,
            serde_json::json!({
                "name": node.name,
                "public": node.public,
                "description": node.description,
                "public_url": node.public_url,
                "url": node.url,
                "sftp_host": node.sftp_host,
                "sftp_port": node.sftp_port,
                "memory": node.memory,
                "disk": node.disk,

                "location_id": node.location.id,
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
        .nest("/{node}", _node_::router(state))
        .with_state(state.clone())
}
