use super::State;
use crate::{
    models::server_backup::ServerBackup,
    routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod download;
mod restore;

pub type GetServerBackup = crate::extract::ConsumingExtension<ServerBackup>;

pub async fn auth(
    state: GetState,
    server: GetServer,
    Path(backup): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let backup = match backup.get(1).map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid backup uuid"])).unwrap(),
                ))
                .unwrap());
        }
    };

    if let Err(error) = server.has_permission("backups.read") {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&[&error])).unwrap(),
            ))
            .unwrap());
    }

    let backup = ServerBackup::by_server_id_uuid(&state.database, server.id, backup).await;
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

    req.extensions_mut().insert(server.0);
    req.extensions_mut().insert(backup);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{
        ApiError,
        api::client::servers::_server_::{GetServer, backups::_backup_::GetServerBackup},
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    pub struct Response {
        backup: crate::models::server_backup::ApiServerBackup,
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
        server: GetServer,
        backup: GetServerBackup,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("backups.read") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    backup: backup.0.into_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{
            GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
        },
    };
    use axum::http::StatusCode;
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
        backup: GetServerBackup,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("backups.delete") {
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

        let uuid = server.uuid;
        if let Err(err) = backup.delete(&state.database, server.0).await {
            tracing::error!(server = %uuid, backup = %backup.uuid, "failed to delete backup: {:#?}", err);

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
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{
            GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
        },
    };
    use axum::http::StatusCode;
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
        mut backup: GetServerBackup,
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
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/download", download::router(state))
        .nest("/restore", restore::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
