use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _step_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            PaginationParams, server_schedule_step::ServerScheduleStep, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        schedule_steps: Vec<shared::models::server_schedule_step::ApiServerScheduleStep>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
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
        schedule: GetServerSchedule,
        Query(params): Query<PaginationParams>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("schedules.read")?;

        let schedule_steps =
            ServerScheduleStep::all_by_schedule_uuid(&state.database, schedule.uuid).await?;

        ApiResponse::json(Response {
            schedule_steps: schedule_steps
                .into_iter()
                .map(|schedule_step| schedule_step.into_api_object())
                .collect(),
        })
        .ok()
    }
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_schedule_step::ServerScheduleStep,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        action: wings_api::ScheduleActionInner,
        order: i16,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        schedule_step: shared::models::server_schedule_step::ApiServerScheduleStep,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
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
        schedule: GetServerSchedule,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("schedules.update")?;

        let settings = state.settings.get().await;

        let schedule_steps =
            ServerScheduleStep::count_by_schedule_uuid(&state.database, schedule.uuid).await;
        if schedule_steps >= settings.server.max_schedules_step_count as i64 {
            return ApiResponse::error("maximum number of schedule steps reached")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        drop(settings);

        let schedule_step = match ServerScheduleStep::create(
            &state.database,
            schedule.uuid,
            data.action,
            data.order,
        )
        .await
        {
            Ok(schedule_step) => schedule_step,
            Err(err) => {
                tracing::error!("failed to create schedule step: {:#?}", err);

                return ApiResponse::error("failed to create schedule step")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:schedule.step.create",
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

        ApiResponse::json(Response {
            schedule_step: schedule_step.into_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{step}", _step_::router(state))
        .with_state(state.clone())
}
