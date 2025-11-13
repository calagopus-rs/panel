use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_schedule::{ExportedServerSchedule, ServerSchedule},
            server_schedule_step::ServerScheduleStep,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        schedule: shared::models::server_schedule::ApiServerSchedule,
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
    ), request_body = ExportedServerSchedule)]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<ExportedServerSchedule>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("schedules.create")?;

        let schedules = ServerSchedule::count_by_server_uuid(&state.database, server.uuid).await;
        if schedules >= server.schedule_limit as i64 {
            return ApiResponse::error("maximum number of schedules reached")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let schedule = match ServerSchedule::create(
            &state.database,
            server.uuid,
            &data.name,
            data.enabled,
            data.triggers,
            data.condition,
        )
        .await
        {
            Ok(schedule) => schedule,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("schedule with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!(name = %data.name, "failed to create schedule: {:#?}", err);

                return ApiResponse::error("failed to create schedule")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        let settings = state.settings.get().await;

        for schedule_step in data
            .steps
            .iter()
            .take(settings.server.max_schedules_step_count as usize)
        {
            ServerScheduleStep::create(
                &state.database,
                schedule.uuid,
                schedule_step.action.clone(),
                schedule_step.order,
            )
            .await?;
        }

        drop(settings);

        activity_logger
            .log(
                "server:schedule.import",
                serde_json::json!({
                    "uuid": schedule.uuid,
                    "name": schedule.name,
                    "enabled": schedule.enabled,
                    "triggers": schedule.triggers,
                    "condition": schedule.condition,
                    "steps": data.steps,
                }),
            )
            .await;

        ApiResponse::json(Response {
            schedule: schedule.into_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
