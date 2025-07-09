use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[serde(default)]
        #[schema(default = "/")]
        root: String,

        #[schema(inline)]
        files: Vec<wings_api::servers_server_files_rename::put::RequestBodyFiles>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        renamed: u64,
    }

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
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
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("files.update") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let request_body = wings_api::servers_server_files_rename::put::RequestBody {
            root: data.root,
            files: data
                .files
                .into_iter()
                .filter(|f| !server.is_ignored(&f.from, false) && !server.is_ignored(&f.to, false))
                .collect(),
        };

        let data = match server
            .node
            .api_client(&state.database)
            .put_servers_server_files_rename(server.uuid, &request_body)
            .await
        {
            Ok(data) => data,
            Err((StatusCode::NOT_FOUND, _)) => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["root directory not found"])),
                );
            }
            Err((StatusCode::EXPECTATION_FAILED, _)) => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["root is not a directory"])),
                );
            }
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to write server file content: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&[
                        "failed to write server file content",
                    ])),
                );
            }
        };

        activity_logger
            .log(
                "server:file.rename",
                serde_json::json!({
                    "directory": request_body.root.trim_start_matches('/'),
                    "files": request_body.files,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    renamed: data.renamed,
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
