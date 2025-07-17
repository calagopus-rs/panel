use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod rotate_password;

mod delete {
    use crate::{
        models::server_database::ServerDatabase,
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
            "database" = i32,
            description = "The database ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, database)): Path<(String, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("databases.delete") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let database =
            match ServerDatabase::by_server_id_id(&state.database, server.id, database).await {
                Some(database) => database,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["database not found"])),
                    );
                }
            };

        if let Err(err) = database.delete(&state.database).await {
            tracing::error!(server = %server.uuid, "failed to delete database: {:#?}", err);

            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiError::new_value(&["failed to delete database"])),
            );
        }

        activity_logger
            .log(
                "server:database.delete",
                serde_json::json!({
                    "database_host": database.database_host.name,
                    "name": database.name,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .nest("/rotate-password", rotate_password::router(state))
        .with_state(state.clone())
}
