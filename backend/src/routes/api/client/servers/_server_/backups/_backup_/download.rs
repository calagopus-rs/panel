use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
        models::server_backup::{BackupDisk, ServerBackup},
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{
                GetUser,
                servers::_server_::{
                    GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
                },
            },
        },
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        #[serde(default)]
        archive_format: wings_api::StreamableArchiveFormat,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(format = "uri")]
        url: String,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "archive_format" = wings_api::StreamableArchiveFormat, Query,
            description = "The format of the archive to download (only for is_streaming = true)",
            example = "tar_gz",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        backup: GetServerBackup,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("backups.download") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if matches!(backup.disk, BackupDisk::S3)
            && let Some(s3_configuration) = &mut server.node.location.backup_configs.s3
        {
            s3_configuration.decrypt(&state.database);

            let client = match s3_configuration.clone().into_client() {
                Ok(client) => client,
                Err(err) => {
                    tracing::error!("Failed to create S3 client: {:#?}", err);

                    return ApiResponse::error("failed to download s3 backup")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };
            let file_path = match backup.upload_path.as_ref() {
                Some(path) => path,
                None => &ServerBackup::s3_path(server.uuid, backup.uuid),
            };

            let url = client.presign_get(file_path, 15 * 60, None).await?;

            activity_logger
                .log(
                    "server:backup.download",
                    serde_json::json!({
                        "backup": backup.uuid,
                        "name": backup.name,
                    }),
                )
                .await;

            return ApiResponse::json(Response { url }).ok();
        }

        #[derive(Serialize)]
        struct BackupDownloadJwt {
            #[serde(flatten)]
            base: BasePayload,

            backup_uuid: uuid::Uuid,
            server_uuid: uuid::Uuid,
            unique_id: uuid::Uuid,
        }

        let token = server.node.create_jwt(
            &state.database,
            &state.jwt,
            &BackupDownloadJwt {
                base: BasePayload {
                    issuer: "panel".into(),
                    subject: None,
                    audience: Vec::new(),
                    expiration_time: Some(chrono::Utc::now().timestamp() + 900),
                    not_before: None,
                    issued_at: Some(chrono::Utc::now().timestamp()),
                    jwt_id: user.uuid.to_string(),
                },
                backup_uuid: backup.uuid,
                server_uuid: server.uuid,
                unique_id: uuid::Uuid::new_v4(),
            },
        )?;

        let mut url = server.node.public_url();
        url.set_path("/download/backup");
        url.set_query(Some(&format!(
            "token={}&archive_format={}",
            urlencoding::encode(&token),
            params.archive_format
        )));

        activity_logger
            .log(
                "server:backup.download",
                serde_json::json!({
                    "uuid": backup.uuid,
                    "name": backup.name,
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
