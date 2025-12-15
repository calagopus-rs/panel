use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _subuser_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, server::GetServer,
            server_subuser::ServerSubuser, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        subusers: Pagination<shared::models::server_subuser::ApiServerSubuser>,
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
        permissions: GetPermissionManager,
        server: GetServer,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("subusers.read")?;

        let subusers = ServerSubuser::by_server_uuid_with_pagination(
            &state.database,
            server.uuid,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            subusers: Pagination {
                total: subusers.total,
                per_page: subusers.per_page,
                page: subusers.page,
                data: subusers
                    .data
                    .into_iter()
                    .map(|subuser| subuser.into_api_object(&storage_url_retriever))
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_subuser::ServerSubuser,
            user::{GetPermissionManager, GetUser},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(email)]
        #[schema(format = "email")]
        email: String,
        #[validate(custom(function = "shared::permissions::validate_server_permissions"))]
        permissions: Vec<compact_str::CompactString>,
        ignored_files: Vec<compact_str::CompactString>,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        subuser: shared::models::server_subuser::ApiServerSubuser,
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
        permissions: GetPermissionManager,
        ip: shared::GetIp,
        user: GetUser,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
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

        permissions.has_server_permission("subusers.create")?;

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
            Err(shared::database::DatabaseError::Sqlx(sqlx::Error::InvalidArgument(err))) => {
                return ApiResponse::error(&err)
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("subuser with email already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!(email = %data.email, "failed to create subuser: {:?}", err);

                return ApiResponse::error("failed to create subuser")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:subuser.create",
                serde_json::json!({
                    "username": username,
                    "email": data.email,
                    "permissions": data.permissions,
                }),
            )
            .await;

        ApiResponse::json(Response {
            subuser: ServerSubuser::by_server_uuid_username(
                &state.database,
                server.uuid,
                &username,
            )
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "subuser with username {} not found after creation",
                    username
                )
            })?
            .into_api_object(&state.storage.retrieve_urls().await),
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
