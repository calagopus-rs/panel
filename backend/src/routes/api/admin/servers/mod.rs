use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _server_;
mod external;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server::Server},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<crate::models::server::AdminApiServer>,
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
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let servers = Server::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            servers: Pagination {
                total: servers.total,
                per_page: servers.per_page,
                page: servers.page,
                data: servers
                    .data
                    .into_iter()
                    .map(|server| {
                        server.into_admin_api_object(&state.database, &storage_url_retriever)
                    })
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::{nest_egg::NestEgg, node::Node, server::Server, user::User},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::GetAdminActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        node_uuid: uuid::Uuid,
        owner_uuid: uuid::Uuid,
        egg_uuid: uuid::Uuid,

        allocation_uuid: Option<uuid::Uuid>,
        allocation_uuids: Vec<uuid::Uuid>,

        start_on_completion: bool,
        skip_scripts: bool,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        limits: crate::models::server::ApiServerLimits,
        pinned_cpus: Vec<i16>,

        #[validate(length(min = 1, max = 1024))]
        #[schema(min_length = 1, max_length = 1024)]
        startup: String,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        image: String,
        #[schema(min_length = 3, max_length = 255, value_type = String)]
        timezone: Option<chrono_tz::Tz>,

        feature_limits: crate::models::server::ApiServerFeatureLimits,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: crate::models::server::AdminApiServer,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let node = match Node::by_uuid(&state.database, data.node_uuid).await? {
            Some(node) => node,
            None => {
                return ApiResponse::error("node not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let owner = match User::by_uuid(&state.database, data.owner_uuid).await? {
            Some(user) => user,
            None => {
                return ApiResponse::error("owner not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let egg = match NestEgg::by_uuid(&state.database, data.egg_uuid).await? {
            Some(egg) => egg,
            None => {
                return ApiResponse::error("egg not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let server = match Server::create(
            &state.database,
            &node,
            owner.uuid,
            egg.uuid,
            data.allocation_uuid,
            &data.allocation_uuids,
            data.external_id.as_deref(),
            data.start_on_completion,
            data.skip_scripts,
            &data.name,
            data.description.as_deref(),
            &data.limits,
            &data.pinned_cpus,
            &data.startup,
            &data.image,
            data.timezone.as_ref().map(|tz| tz.name()),
            &data.feature_limits,
        )
        .await
        {
            Ok(server_uuid) => Server::by_uuid(&state.database, server_uuid)
                .await?
                .ok_or_else(|| anyhow::anyhow!("server not found after creation"))?,
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("server with allocation(s) already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create server: {:#?}", err);

                return ApiResponse::error(&format!("failed to create server: {err}"))
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:create",
                serde_json::json!({
                    "uuid": server.uuid,
                    "node_uuid": node.uuid,
                    "owner_uuid": owner.uuid,
                    "egg_uuid": egg.uuid,

                    "allocation_uuid": data.allocation_uuid,
                    "allocation_uuids": data.allocation_uuids,
                    "external_id": data.external_id,

                    "start_on_completion": data.start_on_completion,
                    "skip_scripts": data.skip_scripts,

                    "name": data.name,
                    "description": data.description,
                    "limits": data.limits,
                    "pinned_cpus": data.pinned_cpus,
                    "startup": data.startup,
                    "image": data.image,
                    "timezone": data.timezone,
                    "feature_limits": data.feature_limits,
                }),
            )
            .await;

        ApiResponse::json(Response {
            server: server
                .into_admin_api_object(&state.database, &state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{server}", _server_::router(state))
        .nest("/external", external::router(state))
        .with_state(state.clone())
}
