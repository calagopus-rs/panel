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
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("settings.reinstall") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'INSTALLING'
            WHERE servers.id = $1 AND servers.status IS NULL",
            server.id
        )
        .execute(&mut *transaction)
        .await?
        .rows_affected();

        if rows_affected == 0 {
            transaction.rollback().await?;

            return ApiResponse::error("server is not in a valid state to reinstall.")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_reinstall(server.uuid)
            .await
        {
            Ok(_) => {}
            Err((_, err)) => {
                transaction.rollback().await?;
                tracing::error!(server = %server.uuid, "failed to reinstall server: {:#?}", err);

                return ApiResponse::error("failed to reinstall server")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        transaction.commit().await?;

        activity_logger
            .log("server:settings.reinstall", serde_json::json!({}))
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
