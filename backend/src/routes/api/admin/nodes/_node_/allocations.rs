use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::{Pagination, PaginationParams, node_allocation::NodeAllocation},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::nodes::_node_::GetNode},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        allocations: Pagination<crate::models::node_allocation::AdminApiNodeAllocation>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
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
        node: GetNode,
        Query(params): Query<PaginationParams>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let allocations = NodeAllocation::by_node_id_with_pagination(
            &state.database,
            node.id,
            params.page,
            params.per_page,
        )
        .await?;

        ApiResponse::json(Response {
            allocations: Pagination {
                total: allocations.total,
                per_page: allocations.per_page,
                page: allocations.page,
                data: allocations
                    .data
                    .into_iter()
                    .map(|node| node.into_admin_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::node_allocation::NodeAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, nodes::_node_::GetNode},
        },
    };
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        ids: Vec<i32>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        NodeAllocation::delete_by_ids(&state.database, &data.ids).await?;

        activity_logger
            .log(
                "node:allocation.delete",
                serde_json::json!({
                    "node_id": node.id,

                    "ids": data.ids
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod put {
    use crate::{
        models::node_allocation::NodeAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, nodes::_node_::GetNode},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[schema(value_type = String)]
        ip: std::net::IpAddr,
        ip_alias: Option<String>,
        ports: Vec<u16>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        created: usize,
    }

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "node" = i32,
            description = "The node ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let allocation_ip = data.ip.into();
        let mut promises = Vec::new();
        promises.reserve_exact(data.ports.len());

        for port in data.ports.iter().copied() {
            if port < 1024 {
                continue;
            }

            promises.push(NodeAllocation::create(
                &state.database,
                node.id,
                &allocation_ip,
                data.ip_alias.as_deref(),
                port as i32,
            ));
        }

        let results = futures_util::future::join_all(promises).await;
        let created = results.iter().filter(|r| r.is_ok()).count();

        activity_logger
            .log(
                "node:allocation.create",
                serde_json::json!({
                    "node_id": node.id,

                    "ip": allocation_ip,
                    "ip_alias": data.ip_alias,
                    "ports": data.ports,
                }),
            )
            .await;

        ApiResponse::json(Response { created }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
