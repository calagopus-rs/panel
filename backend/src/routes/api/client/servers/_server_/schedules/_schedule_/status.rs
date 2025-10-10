use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{server::GetServer, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;

    #[derive(ToSchema, Serialize)]
    struct Response {
        status: wings_api::ScheduleStatus,
    }

    #[utoipa::path(get, path = "/", responses(
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
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        schedule: GetServerSchedule,
    ) -> ApiResponseResult {
        permissions.has_server_permission("schedules.update")?;

        let schedule_status = match server
            .node
            .fetch(&state.database)
            .await?
            .api_client(&state.database)
            .get_servers_server_schedules_schedule(server.uuid, schedule.uuid)
            .await
        {
            Ok(data) => data,
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to get server schedule status: {:#?}", err);

                return ApiResponse::error("failed to get server schedule status")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        ApiResponse::json(Response {
            status: schedule_status.status,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
