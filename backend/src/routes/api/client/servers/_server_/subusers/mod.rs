use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _subuser_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server_subuser::ServerSubuser},
        response::{ApiResponse, ApiResponseResult},
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
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if let Err(error) = server.has_permission("subusers.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let subusers = ServerSubuser::by_server_id_with_pagination(
            &state.database,
            server.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
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
        .ok()
    }
}

mod post {
    use crate::{
        models::server_subuser::ServerSubuser,
        response::{ApiResponse, ApiResponseResult},
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
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if !user.admin
            && let Some(subuser_permissions) = &server.subuser_permissions
            && !data
                .permissions
                .iter()
                .all(|p| subuser_permissions.contains(p))
        {
            return ApiResponse::error("permissions: more permissions than self")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = server.has_permission("subusers.create") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
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
                return ApiResponse::error(&err)
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("subuser with email already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!(email = %data.email, "failed to create subuser: {:#?}", err);

                return ApiResponse::error("failed to create subuser")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
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

        ApiResponse::json(Response {
            subuser: ServerSubuser::by_server_id_username(&state.database, server.id, &username)
                .await?
                .ok_or_else(|| {
                    anyhow::anyhow!(
                        "subuser with username {} not found after creation",
                        username
                    )
                })?
                .into_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{subuser}", _subuser_::router(state))
        .with_state(state.clone())
}
