use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _database_host_;

mod get {
    use crate::{
        models::{
            Pagination, PaginationParamsWithSearch, location_database_host::LocationDatabaseHost,
        },
        routes::{ApiError, GetState, api::admin::locations::_location_::GetLocation},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        database_hosts:
            Pagination<crate::models::location_database_host::AdminApiLocationDatabaseHost>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
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
        ),
    ))]
    pub async fn route(
        state: GetState,
        location: GetLocation,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let database_hosts = LocationDatabaseHost::by_location_id_with_pagination(
            &state.database,
            location.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await;

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
                            .map(|host| host.into_admin_api_object())
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
        models::location_database_host::LocationDatabaseHost,
        routes::{
            ApiError, GetState,
            api::{admin::locations::_location_::GetLocation, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        database_host_id: i32,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        location: GetLocation,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        match LocationDatabaseHost::create(&state.database, location.id, data.database_host_id)
            .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&[
                        "database host already exists in this location",
                    ])),
                );
            }
            Err(err) => {
                tracing::error!("failed to create location database host: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&[
                        "failed to create location database host",
                    ])),
                );
            }
        }

        activity_logger
            .log(
                "admin:location.database-host.create",
                serde_json::json!({
                    "location_id": location.id,
                    "database_host_id": data.database_host_id,
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
        .routes(routes!(post::route))
        .nest("/{database_host}", _database_host_::router(state))
        .with_state(state.clone())
}
