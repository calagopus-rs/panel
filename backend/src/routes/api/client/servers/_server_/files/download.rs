use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
        routes::{
            ApiError, GetState,
            api::client::{
                GetUser,
                servers::_server_::{GetServer, GetServerActivityLogger},
            },
        },
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        file: String,

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
            "file" = String, Query,
            description = "The file to download",
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("files.download") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        #[derive(Serialize)]
        struct FileDownloadJwt<'a> {
            #[serde(flatten)]
            base: BasePayload,

            file_path: &'a str,
            server_uuid: uuid::Uuid,
            unique_id: uuid::Uuid,
        }

        let token = server
            .node
            .create_jwt(
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
                    file_path: &params.file,
                    server_uuid: server.uuid,
                    unique_id: uuid::Uuid::new_v4(),
                },
            )
            .unwrap();

        let mut url = server.node.public_url();
        if params.directory {
            url.set_path("/download/directory");
        } else {
            url.set_path("/download/file");
        }
        url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

        activity_logger
            .log(
                "server:file.download",
                serde_json::json!({
                    "file": params.file.trim_start_matches('/'),
                    "directory": params.directory,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    url: url.to_string(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
