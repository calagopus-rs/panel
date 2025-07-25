use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _database_;
mod hosts;

mod get {
    use crate::{
        models::{Pagination, server_database::ServerDatabase},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Params {
        #[validate(range(min = 1))]
        #[serde(default = "Pagination::default_page")]
        pub page: i64,
        #[validate(range(min = 1, max = 100))]
        #[serde(default = "Pagination::default_per_page")]
        pub per_page: i64,
        #[validate(length(min = 1, max = 100))]
        #[serde(
            default,
            deserialize_with = "crate::deserialize::deserialize_string_option"
        )]
        pub search: Option<String>,

        #[serde(default)]
        include_password: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        databases: Pagination<crate::models::server_database::ApiServerDatabase>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
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
        (
            "search" = Option<String>, Query,
            description = "Search term for username or email",
            example = "admin",
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
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("databases.read") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let databases = ServerDatabase::by_server_id_with_pagination(
            &state.database,
            server.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await;

        let can_read_password = server.has_permission("databases.read-password").is_ok();

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    databases: Pagination {
                        total: databases.total,
                        per_page: databases.per_page,
                        page: databases.page,
                        data: databases
                            .data
                            .into_iter()
                            .map(|database| {
                                database.into_api_object(
                                    &state.database,
                                    params.include_password && can_read_password,
                                )
                            })
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
        models::{database_host::DatabaseHost, server_database::ServerDatabase},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        database_host_id: i32,

        #[validate(
            length(min = 3, max = 31),
            regex(path = "*crate::models::server_database::DB_NAME_REGEX")
        )]
        #[schema(min_length = 3, max_length = 31)]
        #[schema(pattern = "^[a-zA-Z0-9_]+$")]
        name: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        database: crate::models::server_database::ApiServerDatabase,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("databases.create") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let database_host = match DatabaseHost::by_location_id_id(
            &state.database,
            server.node.location.id,
            data.database_host_id,
        )
        .await
        {
            Some(host) => host,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["database host not found"])),
                );
            }
        };

        let databases = ServerDatabase::count_by_server_id(&state.database, server.id).await;
        if databases >= server.database_limit as i64 {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&[
                    "maximum number of databases reached",
                ])),
            );
        }

        let database =
            match ServerDatabase::create(&state.database, server.id, &database_host, &data.name)
                .await
            {
                Ok(database_id) => ServerDatabase::by_id(&state.database, database_id)
                    .await
                    .unwrap(),
                Err(err) if err.to_string().contains("unique constraint") => {
                    return (
                        StatusCode::CONFLICT,
                        axum::Json(ApiError::new_value(&["database with name already exists"])),
                    );
                }
                Err(err) => {
                    tracing::error!(server = %server.uuid, "failed to create database: {:#?}", err);

                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        axum::Json(ApiError::new_value(&["failed to create database"])),
                    );
                }
            };

        activity_logger
            .log(
                "server:database.create",
                serde_json::json!({
                    "database_host": database_host.name,
                    "name": database.name,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    database: database.into_api_object(
                        &state.database,
                        server.has_permission("databases.read-password").is_ok(),
                    ),
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
        .nest("/{database}", _database_::router(state))
        .nest("/hosts", hosts::router(state))
        .with_state(state.clone())
}
