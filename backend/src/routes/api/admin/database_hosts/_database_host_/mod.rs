use super::State;
use crate::{
    models::database_host::DatabaseHost,
    routes::{ApiError, GetState},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod test;

pub type GetDatabaseHost = crate::extract::ConsumingExtension<DatabaseHost>;

pub async fn auth(
    state: GetState,
    Path(database_host): Path<i32>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let database_host = DatabaseHost::by_id(&state.database, database_host).await;
    let database_host = match database_host {
        Some(database_host) => database_host,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["database host not found"]))
                        .unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(database_host);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{ApiError, api::admin::database_hosts::_database_host_::GetDatabaseHost};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        database_host: crate::models::database_host::AdminApiDatabaseHost,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "database_host" = i32,
            description = "The database host ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        database_host: GetDatabaseHost,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    database_host: database_host.0.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::{
        models::database_host::DatabaseHost,
        routes::{
            ApiError, GetState,
            api::{
                admin::database_hosts::_database_host_::GetDatabaseHost,
                client::GetUserActivityLogger,
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
        (status = NOT_FOUND, body = ApiError),
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
        activity_logger: GetUserActivityLogger,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        DatabaseHost::delete_by_id(&state.database, database_host.id).await;

        activity_logger
            .log(
                "admin:database-host.delete",
                serde_json::json!({
                    "id": database_host.id,
                    "name": database_host.name,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::routes::{
        ApiError, GetState,
        api::{
            admin::database_hosts::_database_host_::GetDatabaseHost, client::GetUserActivityLogger,
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        public: Option<bool>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        public_host: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        host: Option<String>,
        public_port: Option<u16>,
        port: Option<u16>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        username: Option<String>,
        #[validate(length(min = 1, max = 512))]
        #[schema(min_length = 1, max_length = 512)]
        password: Option<String>,
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
            "database_host" = i32,
            description = "The database host ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut database_host: GetDatabaseHost,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

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
            database_host.password = state.database.encrypt(&password).unwrap();
        }

        match sqlx::query!(
            "UPDATE database_hosts
            SET name = $1, public = $2, public_host = $3, host = $4, public_port = $5, port = $6, username = $7, password = $8
            WHERE id = $9",
            database_host.name,
            database_host.public,
            database_host.public_host,
            database_host.host,
            database_host.public_port,
            database_host.port,
            database_host.username,
            database_host.password,
            database_host.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["database host with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update database host: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update database host"])),
                );
            }
        }

        activity_logger
            .log(
                "admin:database-host.update",
                serde_json::json!({
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

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/test", test::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
