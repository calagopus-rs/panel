use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::api::admin::nodes::_node_::backups::_backup_::GetServerBackup;
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        jwt::BasePayload,
        models::{node::GetNode, server_backup::BackupDisk, user::GetUser},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

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
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        node: GetNode,
        backup: GetServerBackup,
    ) -> ApiResponseResult {
        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let backup_configuration = match &backup.backup_configuration {
            Some(backup_configuration) => {
                backup_configuration.fetch_cached(&state.database).await?
            }
            None => {
                return ApiResponse::error("backup does not have a backup configuration assigned")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };

        if matches!(backup.disk, BackupDisk::S3)
            && let Some(mut s3_configuration) = backup_configuration.backup_configs.s3
        {
            s3_configuration.decrypt(&state.database).await?;

            let client = match s3_configuration.into_client() {
                Ok(client) => client,
                Err(err) => {
                    tracing::error!("Failed to create S3 client: {:#?}", err);

                    return ApiResponse::error("failed to download s3 backup")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };
            let file_path = match &backup.upload_path {
                Some(path) => path,
                None => {
                    return ApiResponse::error("upload path not found")
                        .with_status(StatusCode::EXPECTATION_FAILED)
                        .ok();
                }
            };

            let url = client.presign_get(file_path, 15 * 60, None).await?;

            return ApiResponse::json(Response { url }).ok();
        }

        #[derive(Serialize)]
        struct BackupDownloadJwt {
            #[serde(flatten)]
            base: BasePayload,

            backup_uuid: uuid::Uuid,
            unique_id: uuid::Uuid,
        }

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
                backup_uuid: backup.uuid,
                unique_id: uuid::Uuid::new_v4(),
            },
        )?;

        let mut url = node.public_url();
        url.set_path("/download/backup");
        url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

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
