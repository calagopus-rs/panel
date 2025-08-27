use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{
                GetServer, GetServerActivityLogger, databases::_database_::GetServerDatabase,
            },
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        password: Option<String>,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "database" = uuid::Uuid,
            description = "The database ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        database: GetServerDatabase,
        activity_logger: GetServerActivityLogger,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("databases.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if database.locked {
            return ApiResponse::error("database is locked and the password cannot be rotated")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let password = match database.rotate_password(&state.database).await {
            Ok(password) => password,
            Err(err) => {
                tracing::error!(server = %server.uuid, "failed to rotate database password: {:#?}", err);

                return ApiResponse::error("failed to rotate database password")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:database.rotate-password",
                serde_json::json!({
                    "uuid": database.uuid,
                    "name": database.name,
                }),
            )
            .await;

        ApiResponse::json(Response {
            password: if server.has_permission("databases.read-password").is_ok() {
                Some(password)
            } else {
                None
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
