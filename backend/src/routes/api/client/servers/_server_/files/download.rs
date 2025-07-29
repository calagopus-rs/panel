use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{
                GetUser,
                servers::_server_::{GetServer, GetServerActivityLogger},
            },
        },
    };
    use axum::http::StatusCode;
    use axum_extra::extract::Query;
    use serde::{Deserialize, Serialize};
    use std::path::{Path, PathBuf};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        #[serde(default)]
        root: String,
        files: Vec<String>,

        #[serde(default)]
        directory: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(format = "uri")]
        url: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "root" = String, Query,
            description = "The root directory to download from",
            example = "/path/to/root",
        ),
        (
            "files" = Vec<String>, Query,
            description = "The file(s) to download",
            example = "/path/to/file.txt",
        ),
        (
            "directory" = bool, Query,
            description = "Whether the file is a directory",
            example = "false",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("files.read-content") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        for file in &params.files {
            if server.is_ignored(file, params.directory) {
                return ApiResponse::json(ApiError::new_value(&["file not found"]))
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        }

        let url = if params.files.len() == 1 {
            #[derive(Serialize)]
            struct FileDownloadJwt {
                #[serde(flatten)]
                base: BasePayload,

                file_path: PathBuf,
                server_uuid: uuid::Uuid,
                unique_id: uuid::Uuid,
            }

            let token = server.node.create_jwt(
                &state.database,
                &state.jwt,
                &FileDownloadJwt {
                    base: BasePayload {
                        issuer: "panel".into(),
                        subject: None,
                        audience: Vec::new(),
                        expiration_time: Some(chrono::Utc::now().timestamp() + 900),
                        not_before: None,
                        issued_at: Some(chrono::Utc::now().timestamp()),
                        jwt_id: user.id.to_string(),
                    },
                    file_path: Path::new(&params.root).join(&params.files[0]),
                    server_uuid: server.uuid,
                    unique_id: uuid::Uuid::new_v4(),
                },
            )?;

            let mut url = server.node.public_url();
            if params.directory {
                url.set_path("/download/directory");
            } else {
                url.set_path("/download/file");
            }
            url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

            url
        } else {
            #[derive(Serialize)]
            struct FilesDownloadJwt<'a> {
                #[serde(flatten)]
                base: BasePayload,

                file_path: &'a str,
                file_paths: &'a [String],
                server_uuid: uuid::Uuid,
                unique_id: uuid::Uuid,
            }

            let token = server.node.create_jwt(
                &state.database,
                &state.jwt,
                &FilesDownloadJwt {
                    base: BasePayload {
                        issuer: "panel".into(),
                        subject: None,
                        audience: Vec::new(),
                        expiration_time: Some(chrono::Utc::now().timestamp() + 900),
                        not_before: None,
                        issued_at: Some(chrono::Utc::now().timestamp()),
                        jwt_id: user.id.to_string(),
                    },
                    file_path: &params.root,
                    file_paths: &params.files,
                    server_uuid: server.uuid,
                    unique_id: uuid::Uuid::new_v4(),
                },
            )?;

            let mut url = server.node.public_url();
            url.set_path("/download/files");
            url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

            url
        };

        activity_logger
            .log(
                "server:file.read-content",
                serde_json::json!({
                    "directory": params.root,
                    "files": params.files,
                }),
            )
            .await;

        ApiResponse::json(Response {
            url: url.to_string(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
