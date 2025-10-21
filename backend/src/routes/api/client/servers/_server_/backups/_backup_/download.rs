use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::api::client::servers::_server_::backups::_backup_::GetServerBackup;
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        jwt::BasePayload,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_backup::{BackupDisk, ServerBackup},
            user::{GetPermissionManager, GetUser},
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
        permissions: GetPermissionManager,
        user: GetUser,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        backup: GetServerBackup,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("backups.download")?;

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let mut backup_configuration = match backup.0.backup_configuration {
            Some(backup_configuration) => {
                backup_configuration.fetch_cached(&state.database).await?
            }
            None => {
                return ApiResponse::error("backup does not have a backup configuration assigned")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };

        if matches!(backup.0.disk, BackupDisk::S3)
            && let Some(s3_configuration) = &mut backup_configuration.backup_configs.s3
        {
            s3_configuration.decrypt(&state.database).await?;

            let client = match s3_configuration.clone().into_client() {
                Ok(client) => client,
                Err(err) => {
                    tracing::error!("Failed to create S3 client: {:#?}", err);

                    return ApiResponse::error("failed to download s3 backup")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };
            let file_path = match backup.0.upload_path.as_ref() {
                Some(path) => path,
                None => &ServerBackup::s3_path(server.uuid, backup.0.uuid),
            };

            let url = client.presign_get(file_path, 15 * 60, None).await?;

            activity_logger
                .log(
                    "server:backup.download",
                    serde_json::json!({
                        "backup": backup.0.uuid,
                        "name": backup.0.name,
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

        let node = server.node.fetch_cached(&state.database).await?;

        let token = node.create_jwt(
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
                backup_uuid: backup.0.uuid,
                server_uuid: server.uuid,
                unique_id: uuid::Uuid::new_v4(),
            },
        )?;

        let mut url = node.public_url();
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
                    "uuid": backup.0.uuid,
                    "name": backup.0.name,
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
