use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_allocation::ServerAllocation,
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
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
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
        activity_logger: GetServerActivityLogger,
        Path((_server, allocation)): Path<(String, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("allocations.delete") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let allocation =
            match ServerAllocation::by_server_id_id(&state.database, server.id, allocation).await {
                Some(allocation) => allocation,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["allocation not found"])),
                    );
                }
            };

        if server
            .egg
            .config_allocations
            .user_self_assign
            .require_primary_allocation
            && server.0.allocation.is_some_and(|a| a.id == allocation.id)
        {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["cannot delete primary allocation"])),
            );
        }

        ServerAllocation::delete_by_id(&state.database, allocation.id).await;

        activity_logger
            .log(
                "server:allocation.delete",
                serde_json::json!({
                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,
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
        models::server_allocation::ServerAllocation,
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
            "allocation" = String,
            description = "The allocation ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, allocation)): Path<(String, i32)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("allocations.update") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let allocation =
            match ServerAllocation::by_server_id_id(&state.database, server.id, allocation).await {
                Some(allocation) => allocation,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["allocation not found"])),
                    );
                }
            };

        let mut transaction = state.database.write().begin().await.unwrap();

        if let Some(notes) = &data.notes {
            let notes = if notes.is_empty() { None } else { Some(notes) };

            sqlx::query!(
                "UPDATE server_allocations SET notes = $1 WHERE id = $2",
                notes,
                allocation.id,
            )
            .execute(&mut *transaction)
            .await
            .unwrap();
        }
        if let Some(primary) = data.primary {
            if server
                .allocation
                .as_ref()
                .is_none_or(|a| a.id == allocation.id)
                && !primary
                && server
                    .egg
                    .config_allocations
                    .user_self_assign
                    .require_primary_allocation
            {
                transaction.rollback().await.unwrap();

                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["cannot unset primary allocation"])),
                );
            }

            if server
                .egg
                .config_allocations
                .user_self_assign
                .require_primary_allocation
                && !primary
            {
                sqlx::query!(
                    "UPDATE servers SET allocation_id = NULL WHERE id = $1",
                    server.id,
                )
                .execute(&mut *transaction)
                .await
                .unwrap();
            } else {
                sqlx::query!(
                    "UPDATE servers SET allocation_id = $1 WHERE id = $2",
                    allocation.id,
                    server.id,
                )
                .execute(&mut *transaction)
                .await
                .unwrap();
            }
        }

        transaction.commit().await.unwrap();

        activity_logger
            .log(
                "server:allocation.update",
                serde_json::json!({
                    "ip": allocation.allocation.ip,
                    "ip_alias": allocation.allocation.ip_alias,
                    "port": allocation.allocation.port,

                    "notes": data.notes,
                    "primary": data.primary,
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
        .with_state(state.clone())
}
