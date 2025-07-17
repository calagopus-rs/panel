use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::{
        ApiError, GetState, api::admin::database_hosts::_database_host_::GetDatabaseHost,
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "database_host" = i32,
            description = "The database host ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        database_host: GetDatabaseHost,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        match database_host.get_connection(&state.database).await {
            Ok(pool) => match pool {
                crate::models::database_host::DatabasePool::Mysql(pool) => {
                    if let Err(err) = sqlx::query("SELECT 1").execute(pool.as_ref()).await {
                        return (
                            StatusCode::EXPECTATION_FAILED,
                            axum::Json(ApiError::new_value(&[&err.to_string()])),
                        );
                    }
                }
                crate::models::database_host::DatabasePool::Postgres(pool) => {
                    if let Err(err) = sqlx::query("SELECT 1").execute(pool.as_ref()).await {
                        return (
                            StatusCode::EXPECTATION_FAILED,
                            axum::Json(ApiError::new_value(&[&err.to_string()])),
                        );
                    }
                }
            },
            Err(err) => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&[&err.to_string()])),
                );
            }
        }

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
