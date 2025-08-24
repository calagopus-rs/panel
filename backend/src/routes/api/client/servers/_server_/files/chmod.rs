use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
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
        files: Vec<wings_api::servers_server_files_chmod::post::RequestBodyFiles>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        updated: u64,
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
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("files.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let request_body = wings_api::servers_server_files_chmod::post::RequestBody {
            root: data.root,
            files: data
                .files
                .into_iter()
                .filter(|f| !server.is_ignored(&f.file, false))
                .collect(),
        };

        let data = match server
            .node
            .api_client(&state.database)
            .post_servers_server_files_chmod(server.uuid, &request_body)
            .await
        {
            Ok(data) => data,
            Err((StatusCode::NOT_FOUND, err)) => {
                return ApiResponse::json(ApiError::new_wings_value(err))
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
            Err((StatusCode::EXPECTATION_FAILED, err)) => {
                return ApiResponse::json(ApiError::new_wings_value(err))
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to chmod server files: {:#?}", err);

                return ApiResponse::error("failed to chmod server files")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:file.chmod",
                serde_json::json!({
                    "directory": request_body.root,
                    "files": request_body.files,
                }),
            )
            .await;

        ApiResponse::json(Response {
            updated: data.updated,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
