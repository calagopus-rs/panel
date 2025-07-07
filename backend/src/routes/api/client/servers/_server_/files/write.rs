use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        file: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
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
        (
            "file" = String, Query,
            description = "The file to write contents to",
            example = "/path/to/file.txt",
        ),
    ), request_body = String)]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Query(params): Query<Params>,
        body: String,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("files.create") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_files_write(server.uuid, &params.file, body)
            .await
        {
            Ok(_) => {}
            Err((StatusCode::NOT_FOUND, _)) => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["file is not a file"])),
                );
            }
            Err((StatusCode::EXPECTATION_FAILED, _)) => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["disk quota exceeded"])),
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
                "server:file.write",
                serde_json::json!({
                    "file": params.file.trim_start_matches('/'),
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
        .routes(routes!(post::route))
        .with_state(state.clone())
}
