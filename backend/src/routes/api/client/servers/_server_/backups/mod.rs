use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _backup_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, server_backup::ServerBackup},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        backups: Pagination<crate::models::server_backup::ApiServerBackup>,
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

        if let Err(error) = server.has_permission("backups.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let backups = ServerBackup::by_server_id_with_pagination(
            &state.database,
            server.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            backups: Pagination {
                total: backups.total,
                per_page: backups.per_page,
                page: backups.page,
                data: backups
                    .data
                    .into_iter()
                    .map(|backup| backup.into_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::server_backup::ServerBackup,
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
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        name: String,

        ignored_files: Vec<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        backup: crate::models::server_backup::ApiServerBackup,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
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

        if let Err(error) = server.has_permission("backups.create") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let backups = ServerBackup::count_by_server_id(&state.database, server.id).await;
        if backups >= server.backup_limit as i64 {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&["maximum number of backups reached"])),
            );
        }

        let backup =
            match ServerBackup::create(&state.database, server.0, &data.name, data.ignored_files)
                .await
            {
                Ok(backup) => backup,
                Err(err) => {
                    tracing::error!(name = %data.name, "failed to create backup: {:#?}", err);

                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        axum::Json(ApiError::new_value(&["failed to create backup"])),
                    );
                }
            };

        activity_logger
            .log(
                "server:backup.create",
                serde_json::json!({
                    "backup": backup.uuid,
                    "name": backup.name,
                    "ignored_files": backup.ignored_files,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    backup: backup.into_api_object(),
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
        .nest("/{backup}", _backup_::router(state))
        .with_state(state.clone())
}
