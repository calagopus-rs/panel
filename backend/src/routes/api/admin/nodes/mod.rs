use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _node_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, node::Node},
        response::{ApiResponse, ApiResponseResult},
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
        (
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let nodes = Node::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            nodes: Pagination {
                total: nodes.total,
                per_page: nodes.per_page,
                page: nodes.page,
                data: nodes
                    .data
                    .into_iter()
                    .map(|node| node.into_admin_api_object(&state.database))
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::{location::Location, node::Node},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUserActivityLogger},
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
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let location = match Location::by_id(&state.database, data.location_id).await? {
            Some(location) => location,
            None => {
                return ApiResponse::error("location not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
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
            Ok(node_id) => Node::by_id(&state.database, node_id)
                .await?
                .ok_or_else(|| anyhow::anyhow!("node not found after creation"))?,
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("node with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create node: {:#?}", err);

                return ApiResponse::error("failed to create node")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "admin:node.create",
                serde_json::json!({
                    "location_id": location.id,

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

        ApiResponse::json(Response {
            node: node.into_admin_api_object(&state.database),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{node}", _node_::router(state))
        .with_state(state.clone())
}
