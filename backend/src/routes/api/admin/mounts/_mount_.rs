use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::mount::Mount,
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetPermissionManager},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        mount: crate::models::mount::AdminApiMount,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Path(mount): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.read")?;

        let mount = match Mount::by_uuid(&state.database, mount).await? {
            Some(mount) => mount,
            None => {
                return ApiResponse::error("mount not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        ApiResponse::json(Response {
            mount: mount.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::mount::Mount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::GetAdminActivityLogger, client::GetPermissionManager},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "mount" = uuid::Uuid,
            description = "The mount ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Path(mount): Path<uuid::Uuid>,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.delete")?;

        let mount = match Mount::by_uuid(&state.database, mount).await? {
            Some(mount) => mount,
            None => {
                return ApiResponse::error("mount not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if mount.eggs > 0 {
            return ApiResponse::error("mount has eggs, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }
        if mount.nodes > 0 {
            return ApiResponse::error("mount has nodes, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }
        if mount.servers > 0 {
            return ApiResponse::error("mount has servers, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        Mount::delete_by_uuid(&state.database, mount.uuid).await?;

        activity_logger
            .log(
                "mount:delete",
                serde_json::json!({
                    "uuid": mount.uuid,
                    "name": mount.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::mount::Mount,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::GetAdminActivityLogger, client::GetPermissionManager},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        source: Option<String>,
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        target: Option<String>,

        read_only: Option<bool>,
        user_mountable: Option<bool>,
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
            "mount" = uuid::Uuid,
            description = "The mount ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Path(mount): Path<uuid::Uuid>,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.update")?;

        let mut mount = match Mount::by_uuid(&state.database, mount).await? {
            Some(mount) => mount,
            None => {
                return ApiResponse::error("mount not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(name) = data.name {
            mount.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                mount.description = None;
            } else {
                mount.description = Some(description);
            }
        }
        if let Some(source) = data.source {
            mount.source = source;
        }
        if let Some(target) = data.target {
            mount.target = target;
        }
        if let Some(read_only) = data.read_only {
            mount.read_only = read_only;
        }
        if let Some(user_mountable) = data.user_mountable {
            mount.user_mountable = user_mountable;
        }

        match sqlx::query!(
            "UPDATE mounts
            SET name = $1, description = $2, source = $3, target = $4, read_only = $5, user_mountable = $6
            WHERE mounts.uuid = $7",
            mount.name,
            mount.description,
            mount.source,
            mount.target,
            mount.read_only,
            mount.user_mountable,
            mount.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("mount with name/source/target already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update mount: {:#?}", err);

                return ApiResponse::error("failed to update mount")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "mount:update",
                serde_json::json!({
                    "uuid": mount.uuid,
                    "name": mount.name,
                    "description": mount.description,

                    "source": mount.source,
                    "target": mount.target,

                    "read_only": mount.read_only,
                    "user_mountable": mount.user_mountable,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
