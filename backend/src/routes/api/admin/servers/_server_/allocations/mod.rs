use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _allocation_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, server_allocation::ServerAllocation},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        allocations: Pagination<crate::models::server_allocation::ApiServerAllocation>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
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
        server: GetServer,
        Query(params): Query<PaginationParams>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let allocations = ServerAllocation::by_server_id_with_pagination(
            &state.database,
            server.id,
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
                    .map(|allocation| {
                        allocation.into_api_object(server.allocation.as_ref().map(|a| a.id))
                    })
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::{node_allocation::NodeAllocation, server_allocation::ServerAllocation},
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::servers::_server_::GetServer, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        allocation_id: i32,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        allocation: crate::models::server_allocation::ApiServerAllocation,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let node_allocation = match NodeAllocation::by_node_id_id(
            &state.database,
            server.node.id,
            data.allocation_id,
        )
        .await?
        {
            Some(allocation) => allocation,
            None => {
                return ApiResponse::error("allocation not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let allocation = match ServerAllocation::create(
            &state.database,
            server.id,
            node_allocation.id,
        )
        .await
        {
            Ok(allocation_id) => ServerAllocation::by_id(&state.database, allocation_id)
                .await?
                .ok_or_else(|| anyhow::anyhow!("allocation not found after creation"))?,
            Err(err) => {
                tracing::error!(server = %server.uuid, "failed to create allocation: {:#?}", err);

                return ApiResponse::error("failed to create allocation")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "admin:server.allocation.create",
                serde_json::json!({
                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,
                }),
            )
            .await;

        ApiResponse::json(Response {
            allocation: allocation.into_api_object(server.allocation.as_ref().map(|a| a.id)),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{allocation}", _allocation_::router(state))
        .with_state(state.clone())
}
