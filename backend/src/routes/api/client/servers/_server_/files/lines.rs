use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Deserialize;
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        file: compact_str::CompactString,
        start_line: u64,
        end_line: u64,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = wings_api::servers_server_files_lines::get::Response),
        (status = BAD_REQUEST, body = ApiError),
        (status = PAYLOAD_TOO_LARGE, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
        (status = UNPROCESSABLE_ENTITY, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "file" = String, Query,
            description = "The file to retrieve contents from",
            example = "/path/to/file.txt",
        ),
        ("start_line" = u64, Query, description = "First line, one-based and inclusive"),
        ("end_line" = u64, Query, description = "Last line, one-based and inclusive"),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("files.read-content")?;

        if server.is_ignored(&params.file, false) {
            return ApiResponse::error("file not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        }

        let max_file_manager_view_size = state
            .settings
            .get_as(|s| s.server.max_file_manager_view_size)
            .await?;

        let contents = match server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .await?
            .get_servers_server_files_lines(
                server.uuid,
                &wings_api::servers_server_files_lines::get::Query {
                    file: Some(params.file.clone()),
                    start_line: Some(params.start_line),
                    end_line: Some(params.end_line),
                    max_size: Some(max_file_manager_view_size),
                    ignored: server.0.subuser_ignored_files,
                    ..Default::default()
                },
            )
            .await
        {
            Ok(data) => data,
            Err(wings_api::client::ApiHttpError::Http(StatusCode::BAD_REQUEST, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::NOT_FOUND, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::PAYLOAD_TOO_LARGE, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::PAYLOAD_TOO_LARGE)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::EXPECTATION_FAILED, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::UNPROCESSABLE_ENTITY, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::UNPROCESSABLE_ENTITY)
                    .ok();
            }
            Err(err) => return Err(err.into()),
        };

        activity_logger
            .log(
                "server:file.read-content",
                serde_json::json!({
                    "file": params.file,
                    "start_line": params.start_line,
                    "end_line": params.end_line,
                }),
            )
            .await;

        ApiResponse::new_serialized(contents).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
