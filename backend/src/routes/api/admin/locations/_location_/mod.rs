use super::State;
use crate::{
    models::location::Location,
    routes::{ApiError, GetState},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod database_hosts;
mod nodes;

pub type GetLocation = crate::extract::ConsumingExtension<Location>;

pub async fn auth(
    state: GetState,
    Path(location): Path<i32>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let location = Location::by_id(&state.database, location).await;
    let location = match location {
        Some(location) => location,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["location not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(location);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{ApiError, api::admin::locations::_location_::GetLocation};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        location: crate::models::location::AdminApiLocation,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ))]
    pub async fn route(location: GetLocation) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    location: location.0.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::{
        models::location::Location,
        routes::{
            ApiError, GetState,
            api::{admin::locations::_location_::GetLocation, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        location: GetLocation,
        activity_logger: GetUserActivityLogger,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if location.nodes > 0 {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["location has nodes, cannot delete"])),
            );
        }

        Location::delete_by_id(&state.database, location.id).await;

        activity_logger
            .log(
                "admin:location.delete",
                serde_json::json!({
                    "short_name": location.short_name,
                    "name": location.name,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::routes::{
        ApiError, GetState,
        api::{admin::locations::_location_::GetLocation, client::GetUserActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 31))]
        #[schema(min_length = 2, max_length = 31)]
        short_name: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        backup_disk: Option<crate::models::server_backup::BackupDisk>,
        backup_configs: Option<crate::models::location::LocationBackupConfigs>,
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
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut location: GetLocation,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Some(name) = data.name {
            location.name = name;
        }
        if let Some(short_name) = data.short_name {
            location.short_name = short_name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                location.description = None;
            } else {
                location.description = Some(description);
            }
        }
        if let Some(backup_disk) = data.backup_disk {
            location.backup_disk = backup_disk;
        }
        if let Some(backup_configs) = data.backup_configs {
            location.backup_configs = backup_configs;
            location.backup_configs.encrypt(&state.database);
        }

        match sqlx::query!(
            "UPDATE locations
            SET short_name = $1, name = $2, description = $3, backup_disk = $4, backup_configs = $5
            WHERE id = $6",
            location.short_name,
            location.name,
            location.description,
            location.backup_disk as crate::models::server_backup::BackupDisk,
            serde_json::to_value(&location.backup_configs).unwrap(),
            location.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["location with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update location: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update location"])),
                );
            }
        }

        let location = location.0.into_admin_api_object();

        activity_logger
            .log(
                "admin:location.update",
                serde_json::json!({
                    "short_name": location.short_name,
                    "name": location.name,
                    "description": location.description,

                    "backup_disk": location.backup_disk,
                    "backup_configs": location.backup_configs,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/nodes", nodes::router(state))
        .nest("/database_hosts", database_hosts::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
