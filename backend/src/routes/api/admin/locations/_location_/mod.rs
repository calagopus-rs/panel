use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, location::Location, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod database_hosts;
mod nodes;

pub type GetLocation = shared::extract::ConsumingExtension<Location>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(location): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let location = match location.first().map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid location uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("locations.read") {
        return Ok(err.into_response());
    }

    let location = Location::by_uuid_optional(&state.database, location).await;
    let location = match location {
        Ok(Some(location)) => location,
        Ok(None) => {
            return Ok(ApiResponse::error("location not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(location);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::locations::_location_::GetLocation;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        location: shared::models::location::AdminApiLocation,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = uuid::Uuid,
            description = "The location ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        location: GetLocation,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("locations.read")?;

        ApiResponse::json(Response {
            location: location.0.into_admin_api_object(&state.database).await,
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::locations::_location_::GetLocation;
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, node::Node,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = uuid::Uuid,
            description = "The location ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        location: GetLocation,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("locations.delete")?;

        if Node::count_by_location_uuid(&state.database, location.uuid).await > 0 {
            return ApiResponse::error("location has nodes, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        location.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "location:delete",
                serde_json::json!({
                    "uuid": location.uuid,
                    "name": location.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::locations::_location_::GetLocation;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger,
            backup_configurations::BackupConfiguration, user::GetPermissionManager,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        backup_configuration_uuid: Option<uuid::Uuid>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,
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
            "location" = uuid::Uuid,
            description = "The location ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut location: GetLocation,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("locations.update")?;

        if let Some(backup_configuration_uuid) = data.backup_configuration_uuid {
            if backup_configuration_uuid.is_nil() {
                location.backup_configuration = None;
            } else {
                let backup_configuration = match BackupConfiguration::by_uuid_optional(
                    &state.database,
                    backup_configuration_uuid,
                )
                .await?
                {
                    Some(backup_configuration) => backup_configuration,
                    None => {
                        return ApiResponse::error("backup configuration not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }
                };

                location.backup_configuration = Some(BackupConfiguration::get_fetchable(
                    backup_configuration.uuid,
                ));
            }
        }
        if let Some(name) = data.name {
            location.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                location.description = None;
            } else {
                location.description = Some(description);
            }
        }

        match sqlx::query!(
            "UPDATE locations
            SET backup_configuration_uuid = $2, name = $3, description = $4
            WHERE locations.uuid = $1",
            location.uuid,
            location
                .backup_configuration
                .as_ref()
                .map(|backup_configuration| backup_configuration.uuid),
            &location.name,
            location.description.as_deref(),
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("location with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update location: {:?}", err);

                return ApiResponse::error("failed to update location")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "location:update",
                serde_json::json!({
                    "uuid": location.uuid,
                    "name": location.name,
                    "description": location.description,
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
        .nest("/nodes", nodes::router(state))
        .nest("/database-hosts", database_hosts::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
