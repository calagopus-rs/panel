use super::State;
use crate::{
    models::nest_egg::NestEgg,
    response::ApiResponse,
    routes::{GetState, api::admin::nests::_nest_::GetNest},
};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod mounts;
mod variables;

pub type GetNestEgg = crate::extract::ConsumingExtension<NestEgg>;

pub async fn auth(
    state: GetState,
    nest: GetNest,
    Path(egg): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let egg = match egg.get(1).map(|s| s.parse::<i32>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid egg id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    let egg = NestEgg::by_nest_id_id(&state.database, nest.id, egg).await;
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
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, api::admin::nests::_nest_::eggs::_egg_::GetNestEgg},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        egg: crate::models::nest_egg::AdminApiNestEgg,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
        (
            "egg" = i32,
            description = "The egg ID",
            example = "1",
        ),
    ))]
    pub async fn route(egg: GetNestEgg) -> ApiResponseResult {
        ApiResponse::json(Response {
            egg: egg.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::nest_egg::NestEgg,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{
                GetAdminActivityLogger,
                nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg},
            },
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
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
        (
            "egg" = i32,
            description = "The egg ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        nest: GetNest,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        if egg.servers > 0 {
            return ApiResponse::error("egg has servers, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        NestEgg::delete_by_id(&state.database, egg.id).await?;

        activity_logger
            .log(
                "nest:egg.delete",
                serde_json::json!({
                    "nest_id": nest.id,
                    "egg_id": egg.id,

                    "author": egg.author,
                    "name": egg.name,
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
            api::admin::{
                GetAdminActivityLogger,
                nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg},
            },
        },
    };
    use axum::http::StatusCode;
    use indexmap::IndexMap;
    use serde::{Deserialize, Serialize};
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
        config_files: Option<Vec<crate::models::nest_egg::ProcessConfigurationFile>>,
        #[schema(inline)]
        config_startup: Option<crate::models::nest_egg::NestEggConfigStartup>,
        #[schema(inline)]
        config_stop: Option<crate::models::nest_egg::NestEggConfigStop>,
        #[schema(inline)]
        config_script: Option<crate::models::nest_egg::NestEggConfigScript>,
        #[schema(inline)]
        config_allocations: Option<crate::models::nest_egg::NestEggConfigAllocations>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        startup: Option<String>,
        force_outgoing_ip: Option<bool>,

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
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
        (
            "egg" = i32,
            description = "The egg ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        nest: GetNest,
        mut egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
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
                author = $1, name = $2, description = $3,
                config_files = $4, config_startup = $5, config_stop = $6,
                config_script = $7, config_allocations = $8, startup = $9,
                force_outgoing_ip = $10, features = $11, docker_images = $12,
                file_denylist = $13
            WHERE nest_id = $14 AND id = $15",
            egg.author,
            egg.name,
            egg.description,
            serde_json::to_value(&egg.config_files).unwrap(),
            serde_json::to_value(&egg.config_startup).unwrap(),
            serde_json::to_value(&egg.config_stop).unwrap(),
            serde_json::to_value(&egg.config_script).unwrap(),
            serde_json::to_value(&egg.config_allocations).unwrap(),
            egg.startup,
            egg.force_outgoing_ip,
            &egg.features,
            serde_json::to_value(&egg.docker_images).unwrap(),
            &egg.file_denylist,
            nest.id,
            egg.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
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
                    "nest_id": nest.id,
                    "egg_id": egg.id,

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
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
