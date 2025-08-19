use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, schedules::_schedule_::GetServerSchedule,
            },
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        schedule: GetServerSchedule,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("schedules.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_sync(server.uuid)
            .await
        {
            Ok(_) => {}
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to post server sync: {:#?}", err);

                return ApiResponse::error("failed to send sync signal to server")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_schedule_schedule_trigger(server.uuid, schedule.uuid)
            .await
        {
            Ok(_) => {}
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to post server schedule trigger: {:#?}", err);

                return ApiResponse::error("failed to send schedule trigger signal to server")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "server:schedule.trigger",
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
