use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        jwt::BasePayload,
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
            "server" = uuid::Uuid,
            description = "The server ID",
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        backup: GetServerBackup,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("backups.download") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        if backup.completed.is_none() {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["backup has not been completed yet"])),
            );
        }

        #[derive(Serialize)]
        struct BackupDownloadJwt {
            #[serde(flatten)]
            base: BasePayload,

            backup_uuid: uuid::Uuid,
            server_uuid: uuid::Uuid,
            unique_id: uuid::Uuid,
        }

        let token = server
            .node
            .create_jwt(
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
                    server_uuid: server.uuid,
                    unique_id: uuid::Uuid::new_v4(),
                },
            )
            .unwrap();

        let mut url = server.node.public_url();
        url.set_path("/download/backup");
        url.set_query(Some(&format!("token={}", urlencoding::encode(&token))));

        activity_logger
            .log(
                "server:backup.download",
                serde_json::json!({
                    "backup": backup.uuid,
                    "name": backup.name,
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
