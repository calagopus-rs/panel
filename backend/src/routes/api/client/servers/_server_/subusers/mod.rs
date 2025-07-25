use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _subuser_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server_subuser::ServerSubuser},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        subusers: Pagination<crate::models::server_subuser::ApiServerSubuser>,
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
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("subusers.read") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let subusers = ServerSubuser::by_server_id_with_pagination(
            &state.database,
            server.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    subusers: Pagination {
                        total: subusers.total,
                        per_page: subusers.per_page,
                        page: subusers.page,
                        data: subusers
                            .data
                            .into_iter()
                            .map(|subuser| subuser.into_api_object())
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
        models::server_subuser::ServerSubuser,
        routes::{
            ApiError, GetState,
            api::client::{
                GetUser,
                servers::_server_::{GetServer, GetServerActivityLogger},
            },
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(email)]
        #[schema(format = "email")]
        email: String,
        #[validate(custom(function = "crate::models::server_subuser::validate_permissions"))]
        permissions: Vec<String>,
        ignored_files: Vec<String>,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        subuser: crate::models::server_subuser::ApiServerSubuser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
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
        ip: crate::GetIp,
        user: GetUser,
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

        if !user.admin
            && let Some(subuser_permissions) = &server.subuser_permissions
            && !data
                .permissions
                .iter()
                .all(|p| subuser_permissions.contains(p))
        {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&[
                    "permissions: more permissions than self",
                ])),
            );
        }

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        if let Err(error) = server.has_permission("subusers.create") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let username = match ServerSubuser::create(
            &state.database,
            &state.settings,
            &state.mail,
            &server,
            &data.email,
            &data.permissions,
            &data.ignored_files,
        )
        .await
        {
            Ok(username) => username,
            Err(sqlx::Error::InvalidArgument(err)) => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&[&err])),
                );
            }
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["subuser with email already exists"])),
                );
            }
            Err(err) => {
                tracing::error!(email = %data.email, "failed to create subuser: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to create subuser"])),
                );
            }
        };

        activity_logger
            .log(
                "server:subuser.create",
                serde_json::json!({
                    "email": data.email,
                    "permissions": data.permissions,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    subuser: ServerSubuser::by_server_id_username(
                        &state.database,
                        server.id,
                        &username,
                    )
                    .await
                    .unwrap()
                    .into_api_object(),
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
        .nest("/{subuser}", _subuser_::router(state))
        .with_state(state.clone())
}
