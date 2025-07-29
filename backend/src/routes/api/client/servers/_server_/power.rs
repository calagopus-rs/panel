use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        signal: wings_api::ServerPowerAction,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission(match data.signal {
            wings_api::ServerPowerAction::Start => "control.start",
            wings_api::ServerPowerAction::Stop => "control.stop",
            wings_api::ServerPowerAction::Kill => "control.stop",
            wings_api::ServerPowerAction::Restart => "control.restart",
        }) {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let request_body = wings_api::servers_server_power::post::RequestBody {
            action: data.signal,
            wait_seconds: None,
        };

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_power(server.uuid, &request_body)
            .await
        {
            Ok(data) => data,
            Err((_, err)) => {
                tracing::error!(server = %server.uuid, "failed to post server power: {:#?}", err);

                return ApiResponse::error("failed to send power signal to server")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:power.signal",
                serde_json::json!({
                    "signal": request_body.action
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
