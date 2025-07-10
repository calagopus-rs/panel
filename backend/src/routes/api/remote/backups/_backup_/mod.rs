use super::State;
use crate::{
    models::server_backup::ServerBackup,
    routes::{ApiError, GetState, api::remote::GetNode},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod restore;

pub type GetBackup = crate::extract::ConsumingExtension<ServerBackup>;

pub async fn auth(
    state: GetState,
    node: GetNode,
    Path(backup): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let backup = ServerBackup::by_node_id_uuid(&state.database, node.id, backup).await;
    let backup = match backup {
        Some(backup) => backup,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["backup not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(backup);
    req.extensions_mut().insert(node.0);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        models::{
            server::Server,
            server_backup::{BackupDisk, ServerBackup},
        },
        routes::{
            ApiError, GetState,
            api::remote::{GetNode, backups::_backup_::GetBackup},
        },
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        size: u64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        parts: Vec<String>,
        part_size: u64,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "size" = u64, Query,
            description = "The size of the backup in bytes",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        backup: GetBackup,
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if backup.disk != BackupDisk::S3 {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["backup is not stored on S3"])),
            );
        }

        let mut s3_configuration = match node.0.location.backup_configs.s3 {
            Some(config) => config,
            None => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["S3 configuration not found"])),
                );
            }
        };
        s3_configuration.decrypt(&state.database);

        let server = match Server::by_id(&state.database, backup.server_id).await {
            Some(server) => server,
            None => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["server not found"])),
                );
            }
        };

        let part_size = s3_configuration.part_size;
        let part_count = (params.size as f64 / s3_configuration.part_size as f64).ceil() as usize;
        let mut parts = Vec::new();
        parts.reserve_exact(part_count);

        let client = match s3_configuration.into_client() {
            Ok(client) => client,
            Err(err) => {
                tracing::error!(
                    backup = %backup.uuid,
                    location = %node.0.location.name,
                    "failed to create S3 client: {:#?}",
                    err
                );

                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["failed to create S3 client"])),
                );
            }
        };

        let file_path = ServerBackup::s3_path(server.uuid, backup.uuid);
        let content_type = ServerBackup::s3_content_type(&file_path);

        let multipart = match client
            .initiate_multipart_upload(&file_path, content_type)
            .await
        {
            Ok(multipart) => multipart,
            Err(err) => {
                tracing::error!(
                    backup = %backup.uuid,
                    location = %node.0.location.name,
                    "failed to initiate multipart upload: {:#?}",
                    err
                );

                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&[
                        "failed to initiate multipart upload",
                    ])),
                );
            }
        };

        for i in 0..part_count {
            let url = match client
                .presign_put(
                    &file_path,
                    60 * 60 * 24,
                    None,
                    Some(HashMap::from([
                        ("partNumber".to_string(), (i + 1).to_string()),
                        ("uploadId".to_string(), multipart.upload_id.clone()),
                    ])),
                )
                .await
            {
                Ok(url) => url,
                Err(err) => {
                    tracing::error!(
                        backup = %backup.uuid,
                        location = %node.0.location.name,
                        "failed to presign post: {:#?}",
                        err
                    );

                    return (
                        StatusCode::EXPECTATION_FAILED,
                        axum::Json(ApiError::new_value(&["failed to presign post"])),
                    );
                }
            };

            parts.push(url);
        }

        sqlx::query!(
            "UPDATE server_backups
            SET upload_id = $1
            WHERE server_backups.uuid = $2",
            multipart.upload_id,
            backup.uuid
        )
        .execute(state.database.write())
        .await
        .unwrap();

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response { parts, part_size }).unwrap()),
        )
    }
}

mod post {
    use crate::{
        models::{
            server::Server,
            server_activity::ServerActivity,
            server_backup::{BackupDisk, ServerBackup},
        },
        routes::{
            ApiError, GetState,
            api::remote::{GetNode, backups::_backup_::GetBackup},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(Debug, ToSchema, Deserialize)]
    pub struct PayloadPart {
        pub etag: String,
        pub part_number: u32,
    }

    #[derive(Debug, ToSchema, Deserialize)]
    pub struct Payload {
        pub checksum: String,
        pub checksum_type: String,
        pub size: u64,
        pub successful: bool,
        #[schema(inline)]
        pub parts: Vec<PayloadPart>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        backup: GetBackup,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if backup.disk == BackupDisk::S3 {
            let upload_id = match backup.0.upload_id {
                Some(id) => id,
                None => {
                    return (
                        StatusCode::EXPECTATION_FAILED,
                        axum::Json(ApiError::new_value(&["upload ID not found"])),
                    );
                }
            };

            let mut s3_configuration = match node.0.location.backup_configs.s3 {
                Some(config) => config,
                None => {
                    return (
                        StatusCode::EXPECTATION_FAILED,
                        axum::Json(ApiError::new_value(&["S3 configuration not found"])),
                    );
                }
            };
            s3_configuration.decrypt(&state.database);

            let server = match Server::by_id(&state.database, backup.0.server_id).await {
                Some(server) => server,
                None => {
                    return (
                        StatusCode::EXPECTATION_FAILED,
                        axum::Json(ApiError::new_value(&["server not found"])),
                    );
                }
            };

            let client = match s3_configuration.into_client() {
                Ok(client) => client,
                Err(err) => {
                    tracing::error!(
                        backup = %backup.0.uuid,
                        location = %node.0.location.name,
                        "failed to create S3 client: {:#?}",
                        err
                    );

                    return (
                        StatusCode::EXPECTATION_FAILED,
                        axum::Json(ApiError::new_value(&["failed to create S3 client"])),
                    );
                }
            };

            let file_path = ServerBackup::s3_path(server.uuid, backup.0.uuid);

            if data.successful {
                match client
                    .complete_multipart_upload(
                        &file_path,
                        &upload_id,
                        data.parts
                            .into_iter()
                            .map(|p| s3::serde_types::Part {
                                part_number: p.part_number,
                                etag: p.etag,
                            })
                            .collect(),
                    )
                    .await
                {
                    Ok(_) => {
                        tracing::info!(
                            backup = %backup.0.uuid,
                            location = %node.0.location.name,
                            "completed multipart upload for backup"
                        );
                    }
                    Err(err) => {
                        tracing::error!(
                            backup = %backup.0.uuid,
                            location = %node.0.location.name,
                            "failed to complete multipart upload: {:#?}",
                            err
                        );
                    }
                }
            } else {
                match client.abort_upload(&file_path, &upload_id).await {
                    Ok(_) => {
                        tracing::info!(
                            backup = %backup.0.uuid,
                            location = %node.0.location.name,
                            "aborted multipart upload for backup"
                        );
                    }
                    Err(err) => {
                        tracing::error!(
                            backup = %backup.0.uuid,
                            location = %node.0.location.name,
                            "failed to abort multipart upload: {:#?}",
                            err
                        );
                    }
                }
            }
        }

        if data.successful {
            sqlx::query!(
                "UPDATE server_backups
                SET checksum = $1, bytes = $2, successful = true, completed = NOW()
                WHERE server_backups.uuid = $3",
                format!("{}:{}", data.checksum_type, data.checksum),
                data.size as i64,
                backup.0.uuid
            )
            .execute(state.database.write())
            .await
            .unwrap();
        } else {
            sqlx::query!(
                "UPDATE server_backups
                SET successful = false, completed = NOW()
                WHERE server_backups.uuid = $1",
                backup.0.uuid
            )
            .execute(state.database.write())
            .await
            .unwrap();
        }

        if let Err(err) = ServerActivity::log(
            &state.database,
            backup.0.server_id,
            None,
            None,
            if data.successful {
                "server:backup.complete"
            } else {
                "server:backup.fail"
            },
            None,
            serde_json::json!({
                "backup": backup.0.uuid,
                "name": backup.0.name,
            }),
        )
        .await
        {
            tracing::warn!(
                backup = %backup.0.uuid,
                "failed to log server activity: {:#?}",
                err
            );
        }

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/restore", restore::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
