use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use axum::{
        extract::{Path, Query},
        http::StatusCode,
    };
    use serde::Serialize;
    use shared::{
        GetState,
        models::{
            Pagination, PaginationParamsWithSearch,
            server::Server,
            user::{GetPermissionManager, GetUser},
            user_server_group::UserServerGroup,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<shared::models::server::ApiServer>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server_group" = uuid::Uuid,
            description = "The server group identifier",
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
        user: GetUser,
        Query(params): Query<PaginationParamsWithSearch>,
        Path(server_group): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        permissions.has_user_permission("servers.read")?;

        let server_group =
            match UserServerGroup::by_user_uuid_uuid(&state.database, user.uuid, server_group)
                .await?
            {
                Some(server_group) => server_group,
                None => {
                    return ApiResponse::error("server group not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        let servers = Server::by_user_uuid_server_order_with_pagination(
            &state.database,
            user.uuid,
            &server_group.server_order,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            servers: servers
                .try_async_map(|server| server.into_api_object(&state.database, &user))
                .await?,
        })
        .ok()
    }
}

mod patch {
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_server_group::UserServerGroup,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 31))]
        #[schema(min_length = 2, max_length = 31)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        server_order: Option<Vec<uuid::Uuid>>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server_group" = uuid::Uuid,
            description = "The server group identifier",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(server_group): Path<uuid::Uuid>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("servers.update")?;

        let mut server_group =
            match UserServerGroup::by_user_uuid_uuid(&state.database, user.uuid, server_group)
                .await?
            {
                Some(server_group) => server_group,
                None => {
                    return ApiResponse::error("server group not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if let Some(name) = data.name {
            server_group.name = name;
        }
        if let Some(server_order) = data.server_order {
            server_group.server_order = server_order;
        }

        sqlx::query!(
            "UPDATE user_server_groups
            SET name = $2, server_order = $3
            WHERE user_server_groups.uuid = $1",
            server_group.uuid,
            &server_group.name,
            &server_group.server_order
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "user:server-group.update",
                serde_json::json!({
                    "uuid": server_group.uuid,
                    "name": server_group.name,
                    "server_order": server_group.server_order,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod delete {
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use shared::{
        GetState,
        models::{
            DeletableModel,
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_server_group::UserServerGroup,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "server_group" = uuid::Uuid,
            description = "The server group identifier",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(server_group): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        permissions.has_user_permission("servers.delete")?;

        let server_group =
            match UserServerGroup::by_user_uuid_uuid(&state.database, user.uuid, server_group)
                .await?
            {
                Some(server_group) => server_group,
                None => {
                    return ApiResponse::error("server group not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        server_group.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "user:server-group.delete",
                serde_json::json!({
                    "uuid": server_group.uuid,
                    "name": server_group.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(patch::route))
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
