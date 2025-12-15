use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{server::Server, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod allocations;
mod clear_state;
mod mounts;
mod transfer;
mod variables;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(server): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_admin_permission("servers.read") {
        return Ok(err.into_response());
    }

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
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{server::GetServer, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: shared::models::server::AdminApiServer,
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
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("servers.read")?;

        ApiResponse::json(Response {
            server: server
                .0
                .into_admin_api_object(&state.database, &state.storage.retrieve_urls().await)
                .await?,
        })
        .ok()
    }
}

mod delete {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, server::GetServer,
            server_backup::ServerBackup, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("servers.delete")?;

        let backups = if data.delete_backups {
            ServerBackup::all_by_server_uuid(&state.database, server.uuid).await?
        } else {
            Vec::new()
        };

        if let Err(err) = server
            .delete(
                &state.database,
                shared::models::server::DeleteServerOptions { force: data.force },
            )
            .await
        {
            tracing::error!("failed to delete server: {:?}", err);

            return ApiResponse::error(&format!("failed to delete server: {err}"))
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        if data.delete_backups {
            for backup in backups {
                let backup_uuid = backup.uuid;

                if let Err(err) = backup.delete(&state.database, ()).await {
                    tracing::error!(server = %server.uuid, backup = %backup_uuid, "failed to delete backup: {:?}", err);

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
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid,
            admin_activity::GetAdminActivityLogger,
            backup_configurations::BackupConfiguration,
            nest_egg::NestEgg,
            server::GetServer,
            user::{GetPermissionManager, User},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use std::str::FromStr;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        owner_uuid: Option<uuid::Uuid>,
        egg_uuid: Option<uuid::Uuid>,
        backup_configuration_uuid: Option<uuid::Uuid>,

        suspended: Option<bool>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        limits: Option<shared::models::server::ApiServerLimits>,
        pinned_cpus: Option<Vec<i16>>,

        #[validate(length(min = 1, max = 8192))]
        #[schema(min_length = 1, max_length = 8192)]
        startup: Option<compact_str::CompactString>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        image: Option<compact_str::CompactString>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        timezone: Option<compact_str::CompactString>,

        feature_limits: Option<shared::models::server::ApiServerFeatureLimits>,
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
        permissions: GetPermissionManager,
        mut server: GetServer,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("servers.update")?;

        if let Some(owner_uuid) = data.owner_uuid {
            let owner = match User::by_uuid_optional(&state.database, owner_uuid).await? {
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
            let egg = match NestEgg::by_uuid_optional(&state.database, egg_uuid).await? {
                Some(egg) => egg,
                None => {
                    return ApiResponse::error("egg not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

            *server.egg = egg;
        }
        if let Some(backup_configuration_uuid) = data.backup_configuration_uuid {
            if backup_configuration_uuid.is_nil() {
                server.backup_configuration = None;
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

                server.backup_configuration = Some(BackupConfiguration::get_fetchable(
                    backup_configuration.uuid,
                ));
            }
        }
        if let Some(suspended) = data.suspended {
            server.suspended = suspended;
        }
        if let Some(external_id) = &data.external_id {
            if external_id.is_empty() {
                server.external_id = None;
            } else {
                server.external_id = Some(external_id.clone());
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
            server.schedule_limit = feature_limits.schedules;
        }

        match sqlx::query!(
            "UPDATE servers
            SET
                owner_uuid = $1, egg_uuid = $2, backup_configuration_uuid = $3,
                suspended = $4, external_id = $5, name = $6, description = $7,
                cpu = $8, memory = $9, swap = $10, disk = $11, io_weight = $12,
                pinned_cpus = $13, startup = $14, image = $15, timezone = $16,
                allocation_limit = $17, backup_limit = $18, database_limit = $19,
                schedule_limit = $20
            WHERE servers.uuid = $21",
            server.owner.uuid,
            server.egg.uuid,
            server
                .backup_configuration
                .as_ref()
                .map(|backup_configuration| backup_configuration.uuid),
            server.suspended,
            server.external_id.as_deref(),
            &server.name,
            server.description.as_deref(),
            server.cpu,
            server.memory,
            server.swap,
            server.disk,
            server.io_weight,
            &server.pinned_cpus,
            &server.startup,
            &server.image,
            server.timezone.as_deref(),
            server.allocation_limit,
            server.backup_limit,
            server.database_limit,
            server.schedule_limit,
            server.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) => {
                tracing::error!("failed to update server: {:?}", err);

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
                tracing::error!("failed to sync server on node: {:?}", err);
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
        .nest("/clear-state", clear_state::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
