use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _allocation_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, server_allocation::ServerAllocation},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
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
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
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
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if let Err(error) = server.has_permission("allocations.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
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
        models::server_allocation::ServerAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

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
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("allocations.create") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let allocations = ServerAllocation::count_by_server_id(&state.database, server.id).await;
        if allocations >= server.allocation_limit as i64 {
            return ApiResponse::error("maximum number of allocations reached")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if !server.egg.config_allocations.user_self_assign.enabled {
            return ApiResponse::error("self-assigning allocations is not enabled for this server")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let allocation = match ServerAllocation::create_random(&state.database, &server).await {
            Ok(allocation_id) => ServerAllocation::by_id(&state.database, allocation_id)
                .await?
                .ok_or_else(|| anyhow::anyhow!("allocation not found after creation"))?,
            Err(err) if err.to_string().contains("null value in column") => {
                return ApiResponse::error("no node allocations are available")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
            Err(err) => {
                tracing::error!(server = %server.uuid, "failed to create allocation: {:#?}", err);

                return ApiResponse::error("failed to create allocation")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:allocation.create",
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
