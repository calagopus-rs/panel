use super::State;
use crate::{
    models::server_database::ServerDatabase,
    response::ApiResponse,
    routes::{GetState, api::client::servers::_server_::GetServer},
};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod rotate_password;
mod size;

pub type GetServerDatabase = crate::extract::ConsumingExtension<ServerDatabase>;

pub async fn auth(
    state: GetState,
    server: GetServer,
    Path(database): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let database = match database.get(1).map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid database uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(error) = server.has_permission("backups.read") {
        return Ok(ApiResponse::error(&error)
            .with_status(StatusCode::UNAUTHORIZED)
            .into_response());
    }

    let database =
        ServerDatabase::by_server_uuid_uuid(&state.database, server.uuid, database).await;
    let database = match database {
        Ok(Some(database)) => database,
        Ok(None) => {
            return Ok(ApiResponse::error("database not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(server.0);
    req.extensions_mut().insert(database);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, databases::_database_::GetServerDatabase},
        },
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Params {
        #[serde(default)]
        pub include_password: bool,
    }

    #[derive(ToSchema, Serialize)]
    pub struct Response {
        database: crate::models::server_database::ApiServerDatabase,
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
            "database" = uuid::Uuid,
            description = "The database ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "include_password" = bool, Query,
            description = "Whether to include the database password in the response",
            example = "true",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        database: GetServerDatabase,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("databases.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        ApiResponse::json(Response {
            database: database
                .0
                .into_api_object(&state.database, params.include_password),
        })
        .ok()
    }
}

mod delete {
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
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
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
        if let Err(error) = server.has_permission("databases.delete") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if database.locked {
            return ApiResponse::error("database is locked and cannot be deleted")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

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

mod patch {
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
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        locked: Option<bool>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
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
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        mut database: GetServerDatabase,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("databases.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if let Some(locked) = data.locked {
            database.locked = locked;
        }

        sqlx::query!(
            "UPDATE server_databases
            SET locked = $1
            WHERE server_databases.uuid = $2",
            database.locked,
            database.uuid,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:database.update",
                serde_json::json!({
                    "uuid": database.uuid,
                    "name": database.name,
                    "locked": database.locked,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/size", size::router(state))
        .nest("/rotate-password", rotate_password::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
