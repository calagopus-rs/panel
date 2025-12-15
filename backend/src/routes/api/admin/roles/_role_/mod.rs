use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, role::Role, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod users;

pub type GetRole = shared::extract::ConsumingExtension<Role>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(role): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_server_permission("roles.read") {
        return Ok(err.into_response());
    }

    let role = Role::by_uuid_optional(&state.database, role).await;
    let role = match role {
        Ok(Some(role)) => role,
        Ok(None) => {
            return Ok(ApiResponse::error("role not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(role);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::roles::_role_::GetRole;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        role: shared::models::role::AdminApiRole,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "role" = uuid::Uuid,
            description = "The role ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(permissions: GetPermissionManager, role: GetRole) -> ApiResponseResult {
        permissions.has_admin_permission("roles.read")?;

        ApiResponse::json(Response {
            role: role.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    use crate::routes::api::admin::roles::_role_::GetRole;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "role" = uuid::Uuid,
            description = "The role ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        role: GetRole,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("roles.delete")?;

        role.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "role:delete",
                serde_json::json!({
                    "uuid": role.uuid,
                    "name": role.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use std::sync::Arc;
    use utoipa::ToSchema;
    use validator::Validate;

    use crate::routes::api::admin::roles::_role_::GetRole;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        #[validate(custom(function = "shared::permissions::validate_admin_permissions"))]
        admin_permissions: Option<Vec<compact_str::CompactString>>,
        #[validate(custom(function = "shared::permissions::validate_server_permissions"))]
        server_permissions: Option<Vec<compact_str::CompactString>>,
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
            "user" = uuid::Uuid,
            description = "The user ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut role: GetRole,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("roles.update")?;

        if let Some(name) = data.name {
            role.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                role.description = None;
            } else {
                role.description = Some(description);
            }
        }
        if let Some(admin_permissions) = data.admin_permissions {
            role.admin_permissions = Arc::new(admin_permissions);
        }
        if let Some(server_permissions) = data.server_permissions {
            role.server_permissions = Arc::new(server_permissions);
        }

        match sqlx::query!(
            "UPDATE roles
            SET name = $2, description = $3, admin_permissions = $4, server_permissions = $5
            WHERE roles.uuid = $1",
            role.uuid,
            &role.name,
            role.description.as_deref(),
            &*role.admin_permissions as &[compact_str::CompactString],
            &*role.server_permissions as &[compact_str::CompactString]
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("role with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update role: {:?}", err);

                return ApiResponse::error("failed to update role")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "role:update",
                serde_json::json!({
                    "uuid": role.uuid,
                    "name": role.name,
                    "description": role.description,
                    "admin_permissions": role.admin_permissions,
                    "server_permissions": role.server_permissions,
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
        .nest("/users", users::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
