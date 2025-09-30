use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::server_schedule::ServerSchedule,
        response::{ApiResponse, ApiResponseResult},
    };
    use std::collections::HashMap;
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct PayloadScheduleStatus {
        uuid: uuid::Uuid,
        successful: bool,
        errors: HashMap<uuid::Uuid, String>,
        timestamp: chrono::DateTime<chrono::Utc>,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[schema(inline)]
        data: Vec<PayloadScheduleStatus>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        for schedule_status in data.data {
            let schedule =
                match ServerSchedule::by_uuid(&state.database, schedule_status.uuid).await? {
                    Some(schedule) => schedule,
                    None => continue,
                };

            let mut futures = Vec::new();
            futures.reserve_exact(2 + schedule_status.errors.len());

            if schedule_status.successful {
                futures.push(
                    sqlx::query!(
                        "UPDATE server_schedules
                        SET last_run = $2
                        WHERE server_schedules.uuid = $1",
                        schedule.uuid,
                        schedule_status.timestamp.naive_utc()
                    )
                    .execute(state.database.write()),
                );
            } else {
                futures.push(
                    sqlx::query!(
                        "UPDATE server_schedules
                        SET last_failure = $2, last_run = $2
                        WHERE server_schedules.uuid = $1",
                        schedule.uuid,
                        schedule_status.timestamp.naive_utc()
                    )
                    .execute(state.database.write()),
                );
            }

            futures.push(
                sqlx::query!(
                    "UPDATE server_schedule_steps
                    SET error = NULL
                    WHERE server_schedule_steps.schedule_uuid = $1 AND server_schedule_steps.uuid != ANY($2)",
                    schedule.uuid,
                    &schedule_status.errors.keys().copied().collect::<Vec<_>>()
                )
                .execute(state.database.write()),
            );

            for (step_uuid, error_message) in schedule_status.errors {
                futures.push(
                    sqlx::query!(
                        "UPDATE server_schedule_steps
                        SET error = $2
                        WHERE server_schedule_steps.uuid = $1",
                        step_uuid,
                        error_message
                    )
                    .execute(state.database.write()),
                );
            }

            futures_util::future::try_join_all(futures).await?;
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
