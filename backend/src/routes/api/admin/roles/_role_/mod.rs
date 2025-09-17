use super::State;
use crate::{models::role::Role, response::ApiResponse, routes::GetState};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod users;

pub type GetRole = crate::extract::ConsumingExtension<Role>;

pub async fn auth(
    state: GetState,
    Path(role): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let role = Role::by_uuid(&state.database, role).await;
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
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, api::admin::roles::_role_::GetRole},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        role: crate::models::role::AdminApiRole,
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
    pub async fn route(role: GetRole) -> ApiResponseResult {
        ApiResponse::json(Response {
            role: role.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::role::Role,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, roles::_role_::GetRole},
        },
    };
    use serde::Serialize;
    use utoipa::ToSchema;

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
        role: GetRole,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        Role::delete_by_uuid(&state.database, role.uuid).await?;

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
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, roles::_role_::GetRole},
        },
    };
    use axum::http::StatusCode;
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

        #[validate(custom(function = "crate::models::role::validate_permissions"))]
        permissions: Option<Vec<String>>,
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
        mut role: GetRole,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

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
        if let Some(permissions) = data.permissions {
            role.permissions = permissions;
        }

        match sqlx::query!(
            "UPDATE roles
            SET name = $2, description = $3, permissions = $4
            WHERE roles.uuid = $1",
            role.uuid,
            role.name,
            role.description,
            &role.permissions
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("role with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update role: {:#?}", err);

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
                    "permissions": role.permissions,
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
