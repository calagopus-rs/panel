use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, database_host::DatabaseHost, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod databases;
mod test;

pub type GetDatabaseHost = shared::extract::ConsumingExtension<DatabaseHost>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(database_host): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_admin_permission("database-hosts.read") {
        return Ok(err.into_response());
    }

    let database_host = DatabaseHost::by_uuid_optional(&state.database, database_host).await;
    let database_host = match database_host {
        Ok(Some(database_host)) => database_host,
        Ok(None) => {
            return Ok(ApiResponse::error("database host not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(database_host);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::database_hosts::_database_host_::GetDatabaseHost;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        database_host: shared::models::database_host::AdminApiDatabaseHost,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "database_host" = uuid::Uuid,
            description = "The database host ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        permissions: GetPermissionManager,
        database_host: GetDatabaseHost,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("database-hosts.read")?;

        ApiResponse::json(Response {
            database_host: database_host.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::database_hosts::_database_host_::GetDatabaseHost;
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger,
            server_database::ServerDatabase, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "database_host" = uuid::Uuid,
            description = "The database host ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        database_host: GetDatabaseHost,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("database-hosts.delete")?;

        if ServerDatabase::count_by_database_host_uuid(&state.database, database_host.uuid).await
            > 0
        {
            return ApiResponse::error("database host has databases, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        database_host.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "database-host:delete",
                serde_json::json!({
                    "uuid": database_host.uuid,
                    "name": database_host.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::database_hosts::_database_host_::GetDatabaseHost;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        public: Option<bool>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        public_host: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        host: Option<compact_str::CompactString>,
        public_port: Option<u16>,
        port: Option<u16>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        username: Option<compact_str::CompactString>,
        #[validate(length(min = 1, max = 512))]
        #[schema(min_length = 1, max_length = 512)]
        password: Option<compact_str::CompactString>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "database_host" = uuid::Uuid,
            description = "The database host ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut database_host: GetDatabaseHost,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("database-hosts.update")?;

        if let Some(name) = data.name {
            database_host.name = name;
        }
        if let Some(public) = data.public {
            database_host.public = public;
        }
        if let Some(public_host) = data.public_host {
            if public_host.is_empty() {
                database_host.public_host = None;
            } else {
                database_host.public_host = Some(public_host);
            }
        }
        if let Some(host) = data.host {
            database_host.host = host;
        }
        if let Some(public_port) = data.public_port {
            if public_port == 0 {
                database_host.public_port = None;
            } else {
                database_host.public_port = Some(public_port as i32);
            }
        }
        if let Some(port) = data.port {
            database_host.port = port as i32;
        }
        if let Some(username) = data.username {
            database_host.username = username;
        }
        if let Some(password) = data.password {
            database_host.password = state.database.encrypt(password).await?;
        }

        match sqlx::query!(
            "UPDATE database_hosts
            SET name = $1, public = $2, public_host = $3, host = $4, public_port = $5, port = $6, username = $7, password = $8
            WHERE database_hosts.uuid = $9",
            &database_host.name,
            database_host.public,
            database_host.public_host.as_deref(),
            &database_host.host,
            database_host.public_port,
            database_host.port,
            &database_host.username,
            database_host.password,
            database_host.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("database host with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update database host: {:?}", err);

                return ApiResponse::error("failed to update database host")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "database-host:update",
                serde_json::json!({
                    "uuid": database_host.uuid,
                    "name": database_host.name,
                    "public": database_host.public,
                    "type": database_host.r#type,

                    "public_host": database_host.public_host,
                    "host": database_host.host,
                    "public_port": database_host.public_port,
                    "port": database_host.port,

                    "username": database_host.username,
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
        .nest("/test", test::router(state))
        .nest("/databases", databases::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
