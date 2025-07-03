use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::{ApiError, GetState, api::client::servers::_server_::GetServer};
    use axum::{
        extract::Query,
        http::{HeaderMap, StatusCode},
    };
    use serde::Deserialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        #[serde(default)]
        file: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = String),
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
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        Query(params): Query<Params>,
    ) -> (StatusCode, HeaderMap, String) {
        let content = match server
            .node
            .api_client(&state.database)
            .get_servers_server_files_contents(server.uuid, params.file, false, 15 * 1024 * 1024)
            .await
        {
            Ok(data) => data,
            Err((StatusCode::NOT_FOUND, _)) => {
                return (
                    StatusCode::NOT_FOUND,
                    HeaderMap::from_iter([(
                        axum::http::header::CONTENT_TYPE,
                        "application/json".parse().unwrap(),
                    )]),
                    ApiError::new_value(&["file not found"]).to_string(),
                );
            }
            Err((StatusCode::PAYLOAD_TOO_LARGE, _)) => {
                return (
                    StatusCode::PAYLOAD_TOO_LARGE,
                    HeaderMap::from_iter([(
                        axum::http::header::CONTENT_TYPE,
                        "application/json".parse().unwrap(),
                    )]),
                    ApiError::new_value(&["file size exceeds limit"]).to_string(),
                );
            }
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to get server file content: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    HeaderMap::from_iter([(
                        axum::http::header::CONTENT_TYPE,
                        "application/json".parse().unwrap(),
                    )]),
                    ApiError::new_value(&["failed to get server file content"]).to_string(),
                );
            }
        };

        (StatusCode::OK, HeaderMap::new(), content)
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
