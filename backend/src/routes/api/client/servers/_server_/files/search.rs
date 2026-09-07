use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{server::GetServer, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[serde(default)]
        pub root: compact_str::CompactString,
        #[schema(inline)]
        pub path_filter:
            Option<wings_api::servers_server_files_search::post::RequestBodyPathFilter>,
        #[schema(inline)]
        pub size_filter:
            Option<wings_api::servers_server_files_search::post::RequestBodySizeFilter>,
        #[schema(inline)]
        pub content_filter:
            Option<wings_api::servers_server_files_search::post::RequestBodyContentFilter>,
        #[schema(inline)]
        pub match_context: Option<wings_api::servers_server_files_search::post::ExtraMatchContext>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        entries: Vec<wings_api::DirectoryEntry>,
        #[serde(skip_serializing_if = "Option::is_none")]
        content_matches: Option<Vec<wings_api::ContentMatches>>,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = PAYLOAD_TOO_LARGE, body = ApiError),
        (status = UNPROCESSABLE_ENTITY, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut server: GetServer,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("files.read")?;
        if data.match_context.is_some() {
            permissions.has_server_permission("files.read-content")?;
        }

        if server.is_ignored(&data.root, true) {
            return ApiResponse::error("root not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        }

        let settings = state.settings.get().await?;

        let request_body = wings_api::servers_server_files_search::post::RequestBody {
            root: data.root,
            path_filter: if let Some(ignored_files) = server.0.subuser_ignored_files {
                Some(
                    wings_api::servers_server_files_search::post::RequestBodyPathFilter {
                        case_insensitive: data
                            .path_filter
                            .as_ref()
                            .is_some_and(|f| f.case_insensitive),
                        include: data
                            .path_filter
                            .as_ref()
                            .map_or(Vec::new(), |f| f.include.to_vec()),
                        exclude: if let Some(filter) = data.path_filter {
                            filter.exclude.into_iter().chain(ignored_files).collect()
                        } else {
                            ignored_files.into_iter().collect()
                        },
                    },
                )
            } else {
                data.path_filter
            },
            size_filter: data.size_filter,
            content_filter: data.content_filter.map(|cf| {
                wings_api::servers_server_files_search::post::RequestBodyContentFilter {
                    max_search_size: cf
                        .max_search_size
                        .min(settings.server.max_file_manager_content_search_size),
                    ..cf
                }
            }),
            per_page: settings.server.max_file_manager_search_results,
        };
        let extra = wings_api::servers_server_files_search::post::Extra {
            match_context: data.match_context,
            ..Default::default()
        };

        drop(settings);

        let response = match server
            .0
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .await?
            .post_servers_server_files_search_with(server.0.uuid, &request_body, &extra)
            .await
        {
            Ok(data) => data,
            Err(wings_api::client::ApiHttpError::Http(StatusCode::NOT_FOUND, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::EXPECTATION_FAILED, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::BAD_REQUEST, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::PAYLOAD_TOO_LARGE, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::PAYLOAD_TOO_LARGE)
                    .ok();
            }
            Err(wings_api::client::ApiHttpError::Http(StatusCode::UNPROCESSABLE_ENTITY, err)) => {
                return ApiResponse::new_serialized(ApiError::new_wings_value(err))
                    .with_status(StatusCode::UNPROCESSABLE_ENTITY)
                    .ok();
            }
            Err(err) => return Err(err.into()),
        };

        ApiResponse::new_serialized(Response {
            entries: response.results,
            content_matches: response.content_matches,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
