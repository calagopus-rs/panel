use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    use crate::routes::api::client::servers::_server_::schedules::_schedule_::GetServerSchedule;

    #[derive(ToSchema, Serialize)]
    struct Response {}

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
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        ip: shared::GetIp,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        schedule: GetServerSchedule,
    ) -> ApiResponseResult {
        permissions.has_server_permission("schedules.update")?;

        state
            .cache
            .ratelimit(
                format!("client/servers/{}/schedules/abort", server.uuid),
                10,
                60,
                ip.to_string(),
            )
            .await?;

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_schedules_schedule_abort(server.uuid, schedule.uuid)
            .await
        {
            Ok(_) => {}
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to post server schedule abort: {:#?}", err);

                return ApiResponse::error("failed to send schedule abort signal to server")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "server:schedule.abort",
                serde_json::json!({
                    "uuid": schedule.uuid,
                    "name": schedule.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
