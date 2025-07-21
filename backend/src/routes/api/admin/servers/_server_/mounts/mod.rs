use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _mount_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, server_mount::ServerMount},
        routes::{ApiError, GetState, api::admin::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        mounts: Pagination<crate::models::server_mount::AdminApiServerMount>,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let mounts = ServerMount::by_server_id_with_pagination(
            &state.database,
            server.id,
            params.page,
            params.per_page,
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    mounts: Pagination {
                        total: mounts.total,
                        per_page: mounts.per_page,
                        page: mounts.page,
                        data: mounts
                            .data
                            .into_iter()
                            .map(|mount| mount.into_admin_api_object())
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
        models::{mount::Mount, server_mount::ServerMount},
        routes::{
            ApiError, GetState,
            api::{admin::servers::_server_::GetServer, client::GetUserActivityLogger},
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mount = match Mount::by_node_id_egg_id_id(
            &state.database,
            server.node.id,
            server.egg.id,
            data.mount_id,
        )
        .await
        {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        match ServerMount::create(&state.database, server.id, mount.id).await {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["mount already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to create server mount: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to create server mount"])),
                );
            }
        };

        activity_logger
            .log(
                "admin:server.mounts.create",
                serde_json::json!({
                    "server_id": server.id,
                    "mount_id": mount.id,
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
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{mount}", _mount_::router(state))
        .with_state(state.clone())
}
