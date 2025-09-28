use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_allocation::ServerAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{
                admin::{GetAdminActivityLogger, servers::_server_::GetServer},
                client::GetPermissionManager,
            },
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
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "allocation" = uuid::Uuid,
            description = "The allocation ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        Path((_server, allocation)): Path<(String, uuid::Uuid)>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("servers.allocations")?;

        let allocation =
            match ServerAllocation::by_server_uuid_uuid(&state.database, server.uuid, allocation)
                .await?
            {
                Some(allocation) => allocation,
                None => {
                    return ApiResponse::error("allocation not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        ServerAllocation::delete_by_uuid(&state.database, allocation.uuid).await?;

        activity_logger
            .log(
                "server:allocation.delete",
                serde_json::json!({
                    "uuid": allocation.uuid,
                    "server_uuid": server.uuid,

                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::server_allocation::ServerAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{
                admin::{GetAdminActivityLogger, servers::_server_::GetServer},
                client::GetPermissionManager,
            },
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        notes: Option<String>,

        primary: Option<bool>,
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
            "allocation" = uuid::Uuid,
            description = "The allocation ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        Path((_server, allocation)): Path<(String, uuid::Uuid)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("servers.allocations")?;

        let allocation =
            match ServerAllocation::by_server_uuid_uuid(&state.database, server.uuid, allocation)
                .await?
            {
                Some(allocation) => allocation,
                None => {
                    return ApiResponse::error("allocation not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        let mut transaction = state.database.write().begin().await?;

        if let Some(notes) = &data.notes {
            let notes = if notes.is_empty() { None } else { Some(notes) };

            sqlx::query!(
                "UPDATE server_allocations
                SET notes = $1
                WHERE server_allocations.uuid = $2",
                notes,
                allocation.uuid,
            )
            .execute(&mut *transaction)
            .await?;
        }
        if let Some(primary) = data.primary {
            if server
                .allocation
                .as_ref()
                .is_some_and(|a| a.uuid == allocation.uuid)
            {
                if !primary {
                    if server
                        .egg
                        .config_allocations
                        .user_self_assign
                        .require_primary_allocation
                    {
                        transaction.rollback().await?;

                        return ApiResponse::error("cannot unset primary allocation")
                            .with_status(StatusCode::BAD_REQUEST)
                            .ok();
                    }

                    sqlx::query!(
                        "UPDATE servers
                        SET allocation_uuid = NULL
                        WHERE servers.uuid = $1",
                        server.uuid,
                    )
                    .execute(&mut *transaction)
                    .await?;
                } else {
                    sqlx::query!(
                        "UPDATE servers
                        SET allocation_uuid = $1
                        WHERE servers.uuid = $2",
                        allocation.uuid,
                        server.uuid,
                    )
                    .execute(&mut *transaction)
                    .await?;
                }
            } else if primary {
                sqlx::query!(
                    "UPDATE servers
                    SET allocation_uuid = $1
                    WHERE servers.uuid = $2",
                    allocation.uuid,
                    server.uuid,
                )
                .execute(&mut *transaction)
                .await?;
            }
        }

        transaction.commit().await?;

        activity_logger
            .log(
                "server:allocation.update",
                serde_json::json!({
                    "uuid": allocation.uuid,
                    "server_uuid": server.uuid,

                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,

                    "notes": data.notes,
                    "primary": data.primary,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
