use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_allocation::ServerAllocation,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, servers::_server_::GetServer},
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
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
        (
            "allocation" = i32,
            description = "The allocation ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        Path((_server, allocation)): Path<(String, i32)>,
    ) -> ApiResponseResult {
        let allocation = match ServerAllocation::by_server_id_id(
            &state.database,
            server.id,
            allocation,
        )
        .await?
        {
            Some(allocation) => allocation,
            None => {
                return ApiResponse::error("allocation not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        ServerAllocation::delete_by_id(&state.database, allocation.id).await?;

        activity_logger
            .log(
                "server:allocation.delete",
                serde_json::json!({
                    "server_id": server.id,

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
            api::admin::{GetAdminActivityLogger, servers::_server_::GetServer},
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
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
        (
            "allocation" = i32,
            description = "The allocation ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        Path((_server, allocation)): Path<(String, i32)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let allocation = match ServerAllocation::by_server_id_id(
            &state.database,
            server.id,
            allocation,
        )
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
                "UPDATE server_allocations SET notes = $1 WHERE id = $2",
                notes,
                allocation.id,
            )
            .execute(&mut *transaction)
            .await?;
        }
        if let Some(primary) = data.primary {
            if server
                .allocation
                .as_ref()
                .is_some_and(|a| a.id == allocation.id)
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
                        "UPDATE servers SET allocation_id = NULL WHERE servers.id = $1",
                        server.id,
                    )
                    .execute(&mut *transaction)
                    .await?;
                } else {
                    sqlx::query!(
                        "UPDATE servers SET allocation_id = $1 WHERE servers.id = $2",
                        allocation.id,
                        server.id,
                    )
                    .execute(&mut *transaction)
                    .await?;
                }
            } else if server.allocation.is_none() && primary {
                sqlx::query!(
                    "UPDATE servers SET allocation_id = $1 WHERE servers.id = $2",
                    allocation.id,
                    server.id,
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
                    "server_id": server.id,

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
