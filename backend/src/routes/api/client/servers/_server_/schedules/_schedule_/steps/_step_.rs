use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod patch {
    use crate::{
        models::server_schedule_step::ServerScheduleStep,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, schedules::_schedule_::GetServerSchedule,
            },
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        action: Option<wings_api::ScheduleActionInner>,
        order: Option<i16>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
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
        (
            "step" = uuid::Uuid,
            description = "The schedule step ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        schedule: GetServerSchedule,
        Path((_server, _schedule, schedule_step)): Path<(uuid::Uuid, uuid::Uuid, uuid::Uuid)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let mut schedule_step = match ServerScheduleStep::by_schedule_uuid_uuid(
            &state.database,
            schedule.uuid,
            schedule_step,
        )
        .await?
        {
            Some(step) => step,
            None => {
                return ApiResponse::error("schedule step not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if let Err(error) = server.has_permission("schedules.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if let Some(action) = data.action {
            schedule_step.action = action;
        }
        if let Some(order) = data.order {
            schedule_step.order = order;
        }

        sqlx::query!(
            "UPDATE server_schedule_steps
            SET action = $2, order_ = $3
            WHERE server_schedule_steps.uuid = $1",
            schedule_step.uuid,
            serde_json::to_value(&schedule_step.action).unwrap(),
            schedule_step.order
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:schedule.step.update",
                serde_json::json!({
                    "uuid": schedule_step.uuid,
                    "action": schedule_step.action,
                    "order": schedule_step.order,
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
                            tracing::warn!(server = %uuid, "failed to post server sync: {:#?}", err);
                        }
                    }
                }
            })
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod delete {
    use crate::{
        models::server_schedule_step::ServerScheduleStep,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, schedules::_schedule_::GetServerSchedule,
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
        (
            "step" = uuid::Uuid,
            description = "The schedule step ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        schedule: GetServerSchedule,
        Path((_server, _schedule, schedule_step)): Path<(uuid::Uuid, uuid::Uuid, uuid::Uuid)>,
    ) -> ApiResponseResult {
        let schedule_step = match ServerScheduleStep::by_schedule_uuid_uuid(
            &state.database,
            schedule.uuid,
            schedule_step,
        )
        .await?
        {
            Some(step) => step,
            None => {
                return ApiResponse::error("schedule step not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if let Err(error) = server.has_permission("schedules.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        ServerScheduleStep::delete_by_uuid(&state.database, schedule_step.uuid).await?;

        activity_logger
            .log(
                "server:schedule.step.delete",
                serde_json::json!({
                    "uuid": schedule_step.uuid,
                    "action": schedule_step.action,
                    "order": schedule_step.order,
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
                            tracing::warn!(server = %uuid, "failed to post server sync: {:#?}", err);
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
        .routes(routes!(patch::route))
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
