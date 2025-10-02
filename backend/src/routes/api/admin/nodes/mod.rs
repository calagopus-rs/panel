use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _node_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{Pagination, PaginationParamsWithSearch, node::Node, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        nodes: Pagination<shared::models::node::AdminApiNode>,
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
        permissions: GetPermissionManager,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("nodes.read")?;

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
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            admin_activity::GetAdminActivityLogger, backup_configurations::BackupConfiguration,
            location::Location, node::Node, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        location_uuid: uuid::Uuid,
        backup_configuration_uuid: Option<uuid::Uuid>,

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

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        maintenance_message: Option<String>,

        memory: i64,
        disk: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        node: shared::models::node::AdminApiNode,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("nodes.create")?;

        let location = match Location::by_uuid(&state.database, data.location_uuid).await? {
            Some(location) => location,
            None => {
                return ApiResponse::error("location not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let backup_configuration = if let Some(backup_configuration_uuid) =
            data.backup_configuration_uuid
        {
            match BackupConfiguration::by_uuid(&state.database, backup_configuration_uuid).await? {
                Some(backup_configuration) => Some(backup_configuration),
                None => {
                    return ApiResponse::error("backup configuration not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            }
        } else {
            None
        };

        let node = match Node::create(
            &state.database,
            location.uuid,
            backup_configuration.map(|backup_configuration| backup_configuration.uuid),
            &data.name,
            data.public,
            data.description.as_deref(),
            data.public_url.as_deref(),
            &data.url,
            data.sftp_host.as_deref(),
            data.sftp_port as i32,
            data.maintenance_message.as_deref(),
            data.memory,
            data.disk,
        )
        .await
        {
            Ok(node_uuid) => Node::by_uuid(&state.database, node_uuid)
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
                "node:create",
                serde_json::json!({
                    "uuid": node.uuid,
                    "location_uuid": location.uuid,

                    "name": node.name,
                    "public": node.public,
                    "description": node.description,
                    "public_url": node.public_url,
                    "url": node.url,
                    "sftp_host": node.sftp_host,
                    "sftp_port": node.sftp_port,
                    "maintenance_message": node.maintenance_message,
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
