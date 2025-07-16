use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("settings.reinstall") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let mut transaction = state.database.write().begin().await.unwrap();

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'INSTALLING'
            WHERE servers.id = $1 AND servers.status IS NULL",
            server.id
        )
        .execute(&mut *transaction)
        .await
        .unwrap()
        .rows_affected();

        if rows_affected == 0 {
            transaction.rollback().await.unwrap();

            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&[
                    "server is not in a valid state to reinstall.",
                ])),
            );
        }

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_reinstall(server.uuid)
            .await
        {
            Ok(_) => {}
            Err((_, err)) => {
                transaction.rollback().await.unwrap();
                tracing::error!(server = %server.uuid, "failed to reinstall server: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to reinstall server"])),
                );
            }
        };

        transaction.commit().await.unwrap();

        activity_logger
            .log("server:settings.reinstall", serde_json::json!({}))
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
