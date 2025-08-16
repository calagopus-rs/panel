use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod rotate_password;
mod size;

mod delete {
    use crate::{
        models::server_database::ServerDatabase,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
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
        activity_logger: GetServerActivityLogger,
        Path((_server, database)): Path<(String, uuid::Uuid)>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("databases.delete") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let database =
            match ServerDatabase::by_server_uuid_uuid(&state.database, server.uuid, database)
                .await?
            {
                Some(database) => database,
                None => {
                    return ApiResponse::error("database not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if let Err(err) = database.delete(&state.database).await {
            tracing::error!(server = %server.uuid, "failed to delete database: {:#?}", err);

            return ApiResponse::error("failed to delete database")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        activity_logger
            .log(
                "server:database.delete",
                serde_json::json!({
                    "uuid": database.uuid,
                    "name": database.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .nest("/size", size::router(state))
        .nest("/rotate-password", rotate_password::router(state))
        .with_state(state.clone())
}
