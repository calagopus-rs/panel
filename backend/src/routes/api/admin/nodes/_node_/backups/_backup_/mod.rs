use super::State;
use crate::{
    models::server_backup::ServerBackup,
    response::ApiResponse,
    routes::{GetState, api::admin::nodes::_node_::GetNode},
};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod download;

pub type GetServerBackup = crate::extract::ConsumingExtension<ServerBackup>;

pub async fn auth(
    state: GetState,
    node: GetNode,
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

    let backup = ServerBackup::by_node_uuid_uuid(&state.database, node.uuid, backup).await;
    let backup = match backup {
        Ok(Some(backup)) if backup.server_uuid.is_none() => backup,
        Ok(_) => {
            return Ok(ApiResponse::error("backup not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(node.0);
    req.extensions_mut().insert(backup);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, api::admin::nodes::_node_::backups::_backup_::GetServerBackup},
    };
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
    pub async fn route(backup: GetServerBackup) -> ApiResponseResult {
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
            api::admin::{
                GetAdminActivityLogger,
                nodes::_node_::{GetNode, backups::_backup_::GetServerBackup},
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
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
        backup: GetServerBackup,
    ) -> ApiResponseResult {
        if backup.completed.is_none() {
            return ApiResponse::error("backup has not been completed yet")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let node_uuid = node.uuid;
        if let Err(err) = backup.delete_detached(&state.database, node.0).await {
            tracing::error!(backup = %backup.uuid, "failed to delete detached backup: {:#?}", err);

            return ApiResponse::error("failed to delete detached backup")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        activity_logger
            .log(
                "node:backup.delete",
                serde_json::json!({
                    "uuid": backup.uuid,
                    "node_uuid": node_uuid,

                    "name": backup.name,
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
        .nest("/download", download::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
