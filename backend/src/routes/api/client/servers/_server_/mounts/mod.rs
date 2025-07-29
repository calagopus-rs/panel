use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _mount_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server_mount::ServerMount},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        mounts: Pagination<crate::models::server_mount::ApiServerMount>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
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
        (
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let mounts = ServerMount::mountable_by_server_id_with_pagination(
            &state.database,
            &server,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            mounts: Pagination {
                total: mounts.total,
                per_page: mounts.per_page,
                page: mounts.page,
                data: mounts
                    .data
                    .into_iter()
                    .map(|mount| mount.into_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::{mount::Mount, server_mount::ServerMount},
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        mount_id: i32,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let mount = match Mount::by_node_id_egg_id_id(
            &state.database,
            server.node.id,
            server.egg.id,
            data.mount_id,
        )
        .await?
        {
            Some(mount) => mount,
            None => {
                return ApiResponse::error("mount not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if !mount.user_mountable {
            return ApiResponse::error("mount not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        }

        match ServerMount::create(&state.database, server.id, mount.id).await {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("mount already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create server mount: {:#?}", err);

                return ApiResponse::error("failed to create server mount")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:mounts.create",
                serde_json::json!({
                    "mount_id": mount.id,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{mount}", _mount_::router(state))
        .with_state(state.clone())
}
