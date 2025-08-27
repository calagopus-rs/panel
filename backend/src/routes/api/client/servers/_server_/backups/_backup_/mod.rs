use super::State;
use crate::{
    models::server_backup::ServerBackup,
    response::ApiResponse,
    routes::{GetState, api::client::servers::_server_::GetServer},
};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
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
            return Ok(ApiResponse::error("invalid backup uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(error) = server.has_permission("backups.read") {
        return Ok(ApiResponse::error(&error)
            .with_status(StatusCode::UNAUTHORIZED)
            .into_response());
    }

    let backup = ServerBackup::by_server_uuid_uuid(&state.database, server.uuid, backup).await;
    let backup = match backup {
        Ok(Some(backup)) => backup,
        Ok(None) => {
            return Ok(ApiResponse::error("backup not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(server.0);
    req.extensions_mut().insert(backup);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError,
            api::client::servers::_server_::{GetServer, backups::_backup_::GetServerBackup},
        },
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
    pub async fn route(server: GetServer, backup: GetServerBackup) -> ApiResponseResult {
        if let Err(error) = server.has_permission("backups.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        ApiResponse::json(Response {
            backup: backup.0.into_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
            },
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
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("backups.delete") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if backup.locked {
            return ApiResponse::error("backup is locked and cannot be deleted")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if let Err(err) = backup.delete(&state.database, &server).await {
            tracing::error!(server = %server.uuid, backup = %backup.uuid, "failed to delete backup: {:#?}", err);

            return ApiResponse::error("failed to delete backup")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        activity_logger
            .log(
                "server:backup.delete",
                serde_json::json!({
                    "uuid": backup.uuid,
                    "name": backup.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, backups::_backup_::GetServerBackup,
            },
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
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = server.has_permission("backups.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
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
            WHERE server_backups.uuid = $3",
            &backup.name,
            backup.locked,
            backup.uuid,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:backup.update",
                serde_json::json!({
                    "uuid": backup.uuid,
                    "name": backup.name,
                    "locked": backup.locked,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
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
