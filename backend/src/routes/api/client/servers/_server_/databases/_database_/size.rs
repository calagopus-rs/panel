use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::server_database::ServerDatabase,
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        size: i64,
    }

    #[utoipa::path(get, path = "/", responses(
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
        Path((_server, database)): Path<(String, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("databases.read") {
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

        let size = match database.get_size(&state.database).await {
            Ok(size) => size,
            Err(err) => {
                tracing::error!(server = %server.uuid, "failed to get database size: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to get database size"])),
                );
            }
        };

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response { size }).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
