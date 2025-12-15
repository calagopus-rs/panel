use super::State;
use crate::routes::api::admin::nests::_nest_::GetNest;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{nest_egg::NestEgg, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod export;
mod mounts;
mod r#move;
mod servers;
mod update;
mod variables;

pub type GetNestEgg = shared::extract::ConsumingExtension<NestEgg>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    nest: GetNest,
    Path(egg): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let egg = match egg.get(1).map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid egg id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("eggs.read") {
        return Ok(err.into_response());
    }

    let egg = NestEgg::by_nest_uuid_uuid(&state.database, nest.uuid, egg).await;
    let egg = match egg {
        Ok(Some(egg)) => egg,
        Ok(None) => {
            return Ok(ApiResponse::error("egg not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(nest.0);
    req.extensions_mut().insert(egg);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::nests::_nest_::eggs::_egg_::GetNestEgg;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        egg: shared::models::nest_egg::AdminApiNestEgg,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "egg" = uuid::Uuid,
            description = "The egg ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        egg: GetNestEgg,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("eggs.read")?;

        ApiResponse::json(Response {
            egg: egg.0.into_admin_api_object(&state.database).await?,
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg};
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, server::Server,
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
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "egg" = uuid::Uuid,
            description = "The egg ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("eggs.delete")?;

        if Server::count_by_egg_uuid(&state.database, egg.uuid).await > 0 {
            return ApiResponse::error("egg has servers, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        egg.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "nest:egg.delete",
                serde_json::json!({
                    "uuid": egg.uuid,
                    "nest_uuid": nest.uuid,

                    "author": egg.author,
                    "name": egg.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg};
    use axum::http::StatusCode;
    use indexmap::IndexMap;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger, egg_repository_egg::EggRepositoryEgg,
            user::GetPermissionManager,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        egg_repository_egg_uuid: Option<uuid::Uuid>,

        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        author: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        #[schema(inline)]
        config_files: Option<Vec<shared::models::nest_egg::ProcessConfigurationFile>>,
        #[schema(inline)]
        config_startup: Option<shared::models::nest_egg::NestEggConfigStartup>,
        #[schema(inline)]
        config_stop: Option<shared::models::nest_egg::NestEggConfigStop>,
        #[schema(inline)]
        config_script: Option<shared::models::nest_egg::NestEggConfigScript>,
        #[schema(inline)]
        config_allocations: Option<shared::models::nest_egg::NestEggConfigAllocations>,

        #[validate(length(min = 1, max = 4096))]
        #[schema(min_length = 1, max_length = 4096)]
        startup: Option<compact_str::CompactString>,
        force_outgoing_ip: Option<bool>,
        separate_port: Option<bool>,

        features: Option<Vec<compact_str::CompactString>>,
        docker_images: Option<IndexMap<compact_str::CompactString, compact_str::CompactString>>,
        file_denylist: Option<Vec<compact_str::CompactString>>,
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
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "egg" = uuid::Uuid,
            description = "The egg ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        mut egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("eggs.update")?;

        if let Some(egg_repository_egg_uuid) = data.egg_repository_egg_uuid {
            if egg_repository_egg_uuid.is_nil() {
                egg.egg_repository_egg = None;
            } else {
                let egg_repository_egg = match EggRepositoryEgg::by_uuid_optional(
                    &state.database,
                    egg_repository_egg_uuid,
                )
                .await?
                {
                    Some(egg_repository_egg) => egg_repository_egg,
                    None => {
                        return ApiResponse::error("backup configuration not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }
                };

                egg.egg_repository_egg =
                    Some(EggRepositoryEgg::get_fetchable(egg_repository_egg.uuid));
            }
        }
        if let Some(name) = data.name {
            egg.name = name;
        }
        if let Some(author) = data.author {
            egg.author = author;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                egg.description = None;
            } else {
                egg.description = Some(description);
            }
        }
        if let Some(config_files) = data.config_files {
            egg.config_files = config_files;
        }
        if let Some(config_startup) = data.config_startup {
            egg.config_startup = config_startup;
        }
        if let Some(config_stop) = data.config_stop {
            egg.config_stop = config_stop;
        }
        if let Some(config_script) = data.config_script {
            egg.config_script = config_script;
        }
        if let Some(config_allocations) = data.config_allocations {
            if !config_allocations.user_self_assign.is_valid() {
                return ApiResponse::error("config_allocations.user_self_assign: port ranges must be 1024-65535 and start_port < end_port")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
            }

            egg.config_allocations = config_allocations;
        }
        if let Some(startup) = data.startup {
            egg.startup = startup;
        }
        if let Some(force_outgoing_ip) = data.force_outgoing_ip {
            egg.force_outgoing_ip = force_outgoing_ip;
        }
        if let Some(separate_port) = data.separate_port {
            egg.separate_port = separate_port;
        }
        if let Some(features) = data.features {
            egg.features = features;
        }
        if let Some(docker_images) = data.docker_images {
            egg.docker_images = docker_images;
        }
        if let Some(file_denylist) = data.file_denylist {
            egg.file_denylist = file_denylist;
        }

        match sqlx::query!(
            "UPDATE nest_eggs
            SET
                egg_repository_egg_uuid = $2, author = $3, name = $4, description = $5,
                config_files = $6, config_startup = $7, config_stop = $8,
                config_script = $9, config_allocations = $10, startup = $11,
                force_outgoing_ip = $12, separate_port = $13, features = $14,
                docker_images = $15, file_denylist = $16
            WHERE nest_eggs.uuid = $1",
            egg.uuid,
            egg.egg_repository_egg.as_ref().map(|e| e.uuid),
            &egg.author,
            &egg.name,
            egg.description.as_deref(),
            serde_json::to_value(&egg.config_files)?,
            serde_json::to_value(&egg.config_startup)?,
            serde_json::to_value(&egg.config_stop)?,
            serde_json::to_value(&egg.config_script)?,
            serde_json::to_value(&egg.config_allocations)?,
            &egg.startup,
            egg.force_outgoing_ip,
            egg.separate_port,
            &egg.features as &[compact_str::CompactString],
            serde_json::to_string(&egg.docker_images)?,
            &egg.file_denylist as &[compact_str::CompactString],
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("egg with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update egg: {:?}", err);

                return ApiResponse::error("failed to update egg")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "nest:egg.update",
                serde_json::json!({
                    "uuid": egg.uuid,
                    "nest_uuid": nest.uuid,
                    "egg_repository_egg_uuid": egg.egg_repository_egg.as_ref().map(|e| e.uuid),

                    "author": egg.author,
                    "name": egg.name,
                    "description": egg.description,

                    "config_files": egg.config_files,
                    "config_startup": egg.config_startup,
                    "config_stop": egg.config_stop,
                    "config_script": egg.config_script,
                    "config_allocations": egg.config_allocations,

                    "startup": egg.startup,
                    "force_outgoing_ip": egg.force_outgoing_ip,
                    "separate_port": egg.separate_port,

                    "features": egg.features,
                    "docker_images": egg.docker_images,
                    "file_denylist": egg.file_denylist,
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
        .nest("/servers", servers::router(state))
        .nest("/update", update::router(state))
        .nest("/variables", variables::router(state))
        .nest("/move", r#move::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/export", export::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
