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

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = ACCEPTED, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_server_permission("settings.cancel-install")?;

        if server.status != Some(shared::models::server::ServerStatus::Installing) {
            return ApiResponse::error("server is not installing")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        match server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .post_servers_server_install_abort(server.uuid)
            .await
        {
            Ok(_) => {}
            Err(wings_api::client::ApiHttpError::Http(StatusCode::CONFLICT, _)) => {
                sqlx::query!(
                    "UPDATE servers
                    SET status = NULL
                    WHERE servers.uuid = $1",
                    server.uuid
                )
                .execute(state.database.write())
                .await?;

                return ApiResponse::json(Response {}).ok();
            }
            Err(err) => return Err(err.into()),
        };

        activity_logger
            .log("server:settings.abort-install", serde_json::json!({}))
            .await;

        ApiResponse::json(Response {})
            .with_status(StatusCode::ACCEPTED)
            .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
