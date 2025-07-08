use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod download;
mod restore;

mod delete {
    use crate::{
        models::server_backup::ServerBackup,
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
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
            "backup" = uuid::Uuid,
            description = "The backup ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, backup)): Path<(String, uuid::Uuid)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("backups.delete") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let backup = match ServerBackup::by_server_id_uuid(&state.database, server.id, backup).await
        {
            Some(backup) => backup,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["backup not found"])),
                );
            }
        };

        if backup.completed.is_none() {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["backup has not been completed yet"])),
            );
        }

        if let Err(err) = ServerBackup::delete_by_uuid(&state.database, &server, backup.uuid).await
        {
            tracing::error!(server = %server.uuid, backup = %backup.uuid, "failed to delete backup: {:#?}", err);

            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiError::new_value(&["failed to delete backup"])),
            );
        }

        activity_logger
            .log(
                "server:backup.delete",
                serde_json::json!({
                    "backup": backup.uuid,
                    "name": backup.name,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::{
        models::server_backup::ServerBackup,
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        name: Option<String>,
        locked: Option<bool>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
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
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, backup)): Path<(String, uuid::Uuid)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("backups.update") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let mut backup =
            match ServerBackup::by_server_id_uuid(&state.database, server.id, backup).await {
                Some(backup) => backup,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["backup not found"])),
                    );
                }
            };

        if backup.completed.is_none() {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["backup has not been completed yet"])),
            );
        }

        if let Some(name) = data.name {
            backup.name = name
        }
        if let Some(locked) = data.locked {
            backup.locked = locked;
        }

        sqlx::query!(
            "UPDATE server_backups
            SET name = $1, locked = $2
            WHERE id = $3",
            &backup.name,
            backup.locked,
            backup.id,
        )
        .execute(state.database.write())
        .await
        .unwrap();

        activity_logger
            .log(
                "server:backup.update",
                serde_json::json!({
                    "backup": backup.uuid,
                    "name": backup.name,
                    "locked": backup.locked,
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
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/download", download::router(state))
        .nest("/restore", restore::router(state))
        .with_state(state.clone())
}
