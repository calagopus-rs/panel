use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::location_database_host::LocationDatabaseHost,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, locations::_location_::GetLocation},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
        (
            "database_host" = i32,
            description = "The database host ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        location: GetLocation,
        activity_logger: GetAdminActivityLogger,
        Path((_location, database_host)): Path<(i32, i32)>,
    ) -> ApiResponseResult {
        let database_host = match LocationDatabaseHost::by_location_id_database_host_id(
            &state.database,
            location.id,
            database_host,
        )
        .await?
        {
            Some(host) => host.database_host,
            None => {
                return ApiResponse::error("database host not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        LocationDatabaseHost::delete_by_ids(&state.database, location.id, database_host.id).await?;

        activity_logger
            .log(
                "location:database-host.delete",
                serde_json::json!({
                    "location_id": location.id,
                    "database_host_id": database_host.id,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
