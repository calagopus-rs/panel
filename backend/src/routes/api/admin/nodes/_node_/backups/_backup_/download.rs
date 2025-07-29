use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
        models::server_backup::BackupDisk,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{
                admin::nodes::_node_::{GetNode, backups::_backup_::GetServerBackup},
                client::GetUser,
            },
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
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
            "node" = i32,
            description = "The node ID",
            example = "1",
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
        mut node: GetNode,
        backup: GetServerBackup,
    ) -> ApiResponseResult {
        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if matches!(backup.disk, BackupDisk::S3) {
            if let Some(s3_configuration) = &mut node.location.backup_configs.s3 {
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
                    None => {
                        return ApiResponse::error("upload path not found")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                };

                let url = client.presign_get(file_path, 15 * 60, None).await?;

                return ApiResponse::json(Response { url }).ok();
            }
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
                    jwt_id: user.id.to_string(),
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
