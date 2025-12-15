use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{server::GetServer, server_schedule::ServerSchedule, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod abort;
mod export;
mod status;
mod steps;
mod trigger;

pub type GetServerSchedule = shared::extract::ConsumingExtension<ServerSchedule>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    server: GetServer,
    Path(schedule): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let schedule = match schedule.get(1).map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid schedule uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_server_permission("schedules.read") {
        return Ok(err.into_response());
    }

    let schedule =
        ServerSchedule::by_server_uuid_uuid(&state.database, server.uuid, schedule).await;
    let schedule = match schedule {
        Ok(Some(schedule)) => schedule,
        Ok(None) => {
            return Ok(ApiResponse::error("schedule not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(server.0);
    req.extensions_mut().insert(schedule);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    pub struct Response {
        schedule: shared::models::server_schedule::ApiServerSchedule,
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
            "schedule" = uuid::Uuid,
            description = "The schedule ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        permissions: GetPermissionManager,
        schedule: GetServerSchedule,
    ) -> ApiResponseResult {
        permissions.has_server_permission("schedules.read")?;

        ApiResponse::json(Response {
            schedule: schedule.0.into_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel,
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
            "schedule" = uuid::Uuid,
            description = "The schedule ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        schedule: GetServerSchedule,
    ) -> ApiResponseResult {
        permissions.has_server_permission("schedules.delete")?;

        schedule.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "server:schedule.delete",
                serde_json::json!({
                    "uuid": schedule.uuid,
                    "name": schedule.name,
                }),
            )
            .await;

        state
            .database
            .batch_action("sync_server", server.uuid, {
                let state = state.clone();

                async move {
                    let uuid = server.uuid;

                    match server.0.sync(&state.database).await {
                        Ok(_) => {}
                        Err(err) => {
                            tracing::warn!(server = %uuid, "failed to post server sync: {:?}", err);
                        }
                    }
                }
            })
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        name: Option<compact_str::CompactString>,
        enabled: Option<bool>,

        triggers: Option<Vec<wings_api::ScheduleTrigger>>,
        condition: Option<wings_api::SchedulePreCondition>,
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
            "schedule" = uuid::Uuid,
            description = "The schedule ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        mut schedule: GetServerSchedule,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("schedules.update")?;

        if let Some(name) = data.name {
            schedule.name = name
        }
        if let Some(enabled) = data.enabled {
            schedule.enabled = enabled;
        }
        if let Some(triggers) = data.triggers {
            schedule.triggers = triggers;
        }
        if let Some(condition) = data.condition {
            schedule.condition = condition;
        }

        sqlx::query!(
            "UPDATE server_schedules
            SET name = $1, enabled = $2, triggers = $3, condition = $4
            WHERE server_schedules.uuid = $5",
            &schedule.name,
            schedule.enabled,
            serde_json::to_value(&schedule.triggers)?,
            serde_json::to_value(&schedule.condition)?,
            schedule.uuid,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:schedule.update",
                serde_json::json!({
                    "uuid": schedule.uuid,
                    "name": schedule.name,
                    "enabled": schedule.enabled,
                    "triggers": schedule.triggers,
                    "condition": schedule.condition,
                }),
            )
            .await;

        state
            .database
            .batch_action("sync_server", server.uuid, {
                let state = state.clone();

                async move {
                    let uuid = server.uuid;

                    match server.0.sync(&state.database).await {
                        Ok(_) => {}
                        Err(err) => {
                            tracing::warn!(server = %uuid, "failed to post server sync: {:?}", err);
                        }
                    }
                }
            })
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/steps", steps::router(state))
        .nest("/status", status::router(state))
        .nest("/export", export::router(state))
        .nest("/abort", abort::router(state))
        .nest("/trigger", trigger::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
