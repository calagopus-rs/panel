use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _database_host_;

mod get {
    use crate::{
        models::{Pagination, PaginationParams, database_host::DatabaseHost},
        routes::{ApiError, GetState},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        database_hosts: Pagination<crate::models::database_host::AdminApiDatabaseHost>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
    ))]
    pub async fn route(
        state: GetState,
        Query(params): Query<PaginationParams>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let database_hosts =
            DatabaseHost::all_with_pagination(&state.database, params.page, params.per_page).await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    database_hosts: Pagination {
                        total: database_hosts.total,
                        per_page: database_hosts.per_page,
                        page: database_hosts.page,
                        data: database_hosts
                            .data
                            .into_iter()
                            .map(|database_host| database_host.into_admin_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::database_host::{DatabaseHost, DatabaseType},
        routes::{ApiError, GetState, api::client::GetUserActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: String,
        public: bool,
        r#type: DatabaseType,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        public_host: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        host: String,
        public_port: Option<u16>,
        port: u16,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        username: String,
        #[validate(length(min = 1, max = 512))]
        #[schema(min_length = 1, max_length = 512)]
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        database_host: crate::models::database_host::AdminApiDatabaseHost,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let database_host = match DatabaseHost::create(
            &state.database,
            &data.name,
            data.public,
            data.r#type,
            data.public_host.as_deref(),
            &data.host,
            data.public_port.map(|port| port as i32),
            data.port as i32,
            &data.username,
            &data.password,
        )
        .await
        {
            Ok(database_host) => database_host,
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&[
                        "database host with name already exists",
                    ])),
                );
            }
            Err(err) => {
                tracing::error!("failed to create database host: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to create database host"])),
                );
            }
        };

        activity_logger
            .log(
                "admin:database_host.create",
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
            axum::Json(
                serde_json::to_value(Response {
                    database_host: database_host.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{database_host}", _database_host_::router(state))
        .with_state(state.clone())
}
