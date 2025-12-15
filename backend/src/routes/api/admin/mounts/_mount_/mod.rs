use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, mount::Mount, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod nest_eggs;
mod nodes;
mod servers;

pub type GetMount = shared::extract::ConsumingExtension<Mount>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(mount): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_server_permission("mounts.read") {
        return Ok(err.into_response());
    }

    let mount = Mount::by_uuid_optional(&state.database, mount).await;
    let mount = match mount {
        Ok(Some(mount)) => mount,
        Ok(None) => {
            return Ok(ApiResponse::error("mount not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(mount);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::mounts::_mount_::GetMount;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        mount: shared::models::mount::AdminApiMount,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "mount" = uuid::Uuid,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(permissions: GetPermissionManager, mount: GetMount) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.read")?;

        ApiResponse::json(Response {
            mount: mount.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::mounts::_mount_::GetMount;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
        activity_logger: GetAdminActivityLogger,
        mount: GetMount,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.delete")?;

        mount.delete(&state.database, ()).await?;

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
    use crate::routes::api::admin::mounts::_mount_::GetMount;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        source: Option<compact_str::CompactString>,
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        target: Option<compact_str::CompactString>,

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
        activity_logger: GetAdminActivityLogger,
        mut mount: GetMount,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("mounts.update")?;

        if let Err(errors) = shared::utils::validate_data(&data) {
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
            &mount.name,
            mount.description.as_deref(),
            &mount.source,
            &mount.target,
            mount.read_only,
            mount.user_mountable,
            mount.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("mount with name/source/target already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update mount: {:?}", err);

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
        .nest("/nest-eggs", nest_eggs::router(state))
        .nest("/nodes", nodes::router(state))
        .nest("/servers", servers::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
