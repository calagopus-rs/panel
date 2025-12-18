use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _backup_;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, node::GetNode, server_backup::ServerBackup, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
            deserialize_with = "shared::deserialize::deserialize_string_option"
        )]
        pub search: Option<compact_str::CompactString>,

        #[serde(default)]
        detached: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        backups: Pagination<shared::models::server_backup::AdminApiServerBackup>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "node" = uuid::Uuid,
            description = "The node ID",
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
        (
            "detached" = bool, Query,
            description = "Only show backups that are detached",
            example = "false",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        node: GetNode,
        Query(params): Query<Params>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("nodes.backups")?;

        let backups = if params.detached {
            ServerBackup::by_detached_node_uuid_with_pagination(
                &state.database,
                node.uuid,
                params.page,
                params.per_page,
                params.search.as_deref(),
            )
            .await
        } else {
            ServerBackup::by_node_uuid_with_pagination(
                &state.database,
                node.uuid,
                params.page,
                params.per_page,
                params.search.as_deref(),
            )
            .await
        }?;

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            backups: backups
                .try_async_map(|backup| {
                    backup.into_admin_api_object(&state.database, &storage_url_retriever)
                })
                .await?,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/{backup}", _backup_::router(state))
        .with_state(state.clone())
}
