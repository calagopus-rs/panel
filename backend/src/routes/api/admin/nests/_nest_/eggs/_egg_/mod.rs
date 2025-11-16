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
        ApiError,
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
    pub async fn route(permissions: GetPermissionManager, egg: GetNestEgg) -> ApiResponseResult {
        permissions.has_admin_permission("eggs.read")?;

        ApiResponse::json(Response {
            egg: egg.0.into_admin_api_object(),
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

        if Server::count_by_nest_egg_uuid(&state.database, egg.uuid).await > 0 {
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
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        author: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

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
        startup: Option<String>,
        force_outgoing_ip: Option<bool>,
        separate_port: Option<bool>,

        features: Option<Vec<String>>,
        docker_images: Option<IndexMap<String, String>>,
        file_denylist: Option<Vec<String>>,
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
                author = $2, name = $3, description = $4,
                config_files = $5, config_startup = $6, config_stop = $7,
                config_script = $8, config_allocations = $9, startup = $10,
                force_outgoing_ip = $11, separate_port = $12, features = $13,
                docker_images = $14, file_denylist = $15
            WHERE nest_eggs.uuid = $1",
            egg.uuid,
            egg.author,
            egg.name,
            egg.description,
            serde_json::to_value(&egg.config_files)?,
            serde_json::to_value(&egg.config_startup)?,
            serde_json::to_value(&egg.config_stop)?,
            serde_json::to_value(&egg.config_script)?,
            serde_json::to_value(&egg.config_allocations)?,
            egg.startup,
            egg.force_outgoing_ip,
            egg.separate_port,
            &egg.features,
            serde_json::to_value(&egg.docker_images)?,
            &egg.file_denylist,
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
                tracing::error!("failed to update egg: {:#?}", err);

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
        .nest("/variables", variables::router(state))
        .nest("/mounts", mounts::router(state))
        .nest("/export", export::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
