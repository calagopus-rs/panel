use super::State;
use crate::{models::server::Server, response::ApiResponse, routes::GetState};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod allocations;
mod mounts;
mod transfer;
mod variables;

pub type GetServer = crate::extract::ConsumingExtension<Server>;

pub async fn auth(
    state: GetState,
    Path(server): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let server = Server::by_identifier(&state.database, &server[0]).await;
    let server = match server {
        Ok(Some(server)) => server,
        Ok(None) => {
            return Ok(ApiResponse::error("server not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(server);

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::servers::_server_::GetServer},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: crate::models::server::AdminApiServer,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(state: GetState, server: GetServer) -> ApiResponseResult {
        ApiResponse::json(Response {
            server: server.0.into_admin_api_object(&state.database),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::server_backup::ServerBackup,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, servers::_server_::GetServer},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        force: bool,
        delete_backups: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
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
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let backups = if data.delete_backups {
            ServerBackup::all_by_server_uuid(&state.database, server.uuid).await?
        } else {
            Vec::new()
        };

        if let Err(err) = server.delete(&state.database, data.force).await {
            tracing::error!("failed to delete server: {:#?}", err);

            return ApiResponse::error(&format!("failed to delete server: {err}"))
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if data.delete_backups {
            for backup in backups {
                if let Err(err) = backup.delete(&state.database, &server).await {
                    tracing::error!(server = %server.uuid, backup = %backup.uuid, "failed to delete backup: {:#?}", err);

                    if !data.force {
                        return ApiResponse::error(&format!("failed to delete backup: {err}"))
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                }
            }
        }

        activity_logger
            .log(
                "server:delete",
                serde_json::json!({
                    "uuid": server.uuid,
                    "name": server.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::{nest_egg::NestEgg, user::User},
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, servers::_server_::GetServer},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use std::str::FromStr;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        owner_uuid: Option<uuid::Uuid>,
        egg_uuid: Option<uuid::Uuid>,

        suspended: Option<bool>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        limits: Option<crate::models::server::ApiServerLimits>,
        pinned_cpus: Option<Vec<i16>>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        startup: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        image: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        timezone: Option<String>,

        feature_limits: Option<crate::models::server::ApiServerFeatureLimits>,
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
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut server: GetServer,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(owner_uuid) = data.owner_uuid {
            let owner = match User::by_uuid(&state.database, owner_uuid).await? {
                Some(owner) => owner,
                None => {
                    return ApiResponse::error("owner not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

            server.owner = owner;
        }
        if let Some(egg_uuid) = data.egg_uuid {
            let egg = match NestEgg::by_uuid(&state.database, egg_uuid).await? {
                Some(egg) => egg,
                None => {
                    return ApiResponse::error("egg not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

            server.egg = egg;
        }
        if let Some(suspended) = data.suspended {
            server.suspended = suspended;
        }
        if let Some(external_id) = &data.external_id {
            if external_id.is_empty() {
                server.external_id = None;
            } else {
                server.external_id = Some(external_id.to_string());
            }
        }
        if let Some(name) = data.name {
            server.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                server.description = None;
            } else {
                server.description = Some(description);
            }
        }
        if let Some(limits) = &data.limits {
            server.cpu = limits.cpu;
            server.memory = limits.memory;
            server.swap = limits.swap;
            server.disk = limits.disk;
            server.io_weight = limits.io_weight;
        }
        if let Some(pinned_cpus) = data.pinned_cpus {
            server.pinned_cpus = pinned_cpus;
        }
        if let Some(startup) = data.startup {
            server.startup = startup;
        }
        if let Some(image) = data.image {
            server.image = image;
        }
        if let Some(timezone) = data.timezone {
            if timezone.is_empty() {
                server.timezone = None;
            } else {
                if chrono_tz::Tz::from_str(&timezone).is_err() {
                    return ApiResponse::error("invalid timezone")
                        .with_status(StatusCode::BAD_REQUEST)
                        .ok();
                }

                server.timezone = Some(timezone);
            }
        }
        if let Some(feature_limits) = &data.feature_limits {
            server.allocation_limit = feature_limits.allocations;
            server.backup_limit = feature_limits.backups;
            server.database_limit = feature_limits.databases;
        }

        match sqlx::query!(
            "UPDATE servers
            SET
                owner_uuid = $1, egg_uuid = $2, suspended = $3, external_id = $4,
                name = $5, description = $6, cpu = $7, memory = $8,
                swap = $9, disk = $10, io_weight = $11, pinned_cpus = $12,
                startup = $13, image = $14, timezone = $15, allocation_limit = $16,
                backup_limit = $17, database_limit = $18
            WHERE servers.uuid = $19",
            server.owner.uuid,
            server.egg.uuid,
            server.suspended,
            server.external_id,
            server.name,
            server.description,
            server.cpu,
            server.memory,
            server.swap,
            server.disk,
            server.io_weight,
            &server.pinned_cpus,
            server.startup,
            server.image,
            server.timezone,
            server.allocation_limit,
            server.backup_limit,
            server.database_limit,
            server.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) => {
                tracing::error!("failed to update server: {:#?}", err);

                return ApiResponse::error(&format!("failed to update server: {err}"))
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "server:update",
                serde_json::json!({
                    "uuid": server.uuid,
                    "owner_uuid": server.owner.uuid,
                    "egg_uuid": server.egg.uuid,

                    "external_id": server.external_id,
                    "name": server.name,
                    "description": server.description,
                    "limits": data.limits,
                    "pinned_cpus": server.pinned_cpus,
                    "startup": server.startup,
                    "image": server.image,
                    "timezone": server.timezone,
                    "feature_limits": data.feature_limits,
                }),
            )
            .await;

        tokio::spawn(async move {
            if let Err(err) = server.0.sync(&state.database).await {
                tracing::error!("failed to sync server on node: {:#?}", err);
            }
        });

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/variables", variables::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/transfer", transfer::router(state))
        .nest("/allocations", allocations::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
