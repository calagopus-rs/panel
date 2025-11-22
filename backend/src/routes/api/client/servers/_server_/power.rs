use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
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
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_server_permission(match data.signal {
            wings_api::ServerPowerAction::Start => "control.start",
            wings_api::ServerPowerAction::Stop => "control.stop",
            wings_api::ServerPowerAction::Kill => "control.kill",
            wings_api::ServerPowerAction::Restart => "control.restart",
        })?;

        server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .post_servers_server_power(
                server.uuid,
                &wings_api::servers_server_power::post::RequestBody {
                    action: data.signal,
                    wait_seconds: None,
                },
            )
            .await?;

        activity_logger
            .log(
                "server:power.signal",
                serde_json::json!({
                    "signal": data.signal
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
