use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod variables;

mod delete {
    use crate::{
        models::{nest::Nest, nest_egg::NestEgg},
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
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
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path((nest, egg)): Path<(i32, i32)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let nest = match Nest::by_id(&state.database, nest).await {
            Some(nest) => nest,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["nest not found"])),
                );
            }
        };

        let egg = match NestEgg::by_nest_id_id(&state.database, nest.id, egg).await {
            Some(egg) => egg,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["egg not found"])),
                );
            }
        };

        NestEgg::delete_by_id(&state.database, egg.id).await;

        user.log_activity(
            &state.database,
            "admin:egg.delete",
            ip,
            auth,
            serde_json::json!({
                "nest": nest.name,

                "author": nest.author,
                "name": nest.name,
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
    use crate::{
        models::nest::Nest,
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
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

        config_files: Option<Vec<crate::models::nest_egg::ProcessConfigurationFile>>,
        config_startup: Option<crate::models::nest_egg::NestEggConfigStartup>,
        config_stop: Option<crate::models::nest_egg::NestEggConfigStop>,
        config_script: Option<crate::models::nest_egg::NestEggConfigScript>,

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
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path((nest, egg)): Path<(i32, i32)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let nest = match Nest::by_id(&state.database, nest).await {
            Some(nest) => nest,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["nest not found"])),
                );
            }
        };

        let mut egg =
            match crate::models::nest_egg::NestEgg::by_nest_id_id(&state.database, nest.id, egg)
                .await
            {
                Some(egg) => egg,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["egg not found"])),
                    );
                }
            };

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
                config_script = $7, startup = $8, force_outgoing_ip = $9,
                features = $10, docker_images = $11, file_denylist = $12
            WHERE nest_id = $13 AND id = $14",
            egg.author,
            egg.name,
            egg.description,
            serde_json::to_value(&egg.config_files).unwrap(),
            serde_json::to_value(&egg.config_startup).unwrap(),
            serde_json::to_value(&egg.config_stop).unwrap(),
            serde_json::to_value(&egg.config_script).unwrap(),
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["egg with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update egg: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update egg"])),
                );
            }
        }

        user.log_activity(
            &state.database,
            "admin:egg.update",
            ip,
            auth,
            serde_json::json!({
                "nest": nest.name,

                "author": egg.author,
                "name": egg.name,
                "description": egg.description,

                "config_files": egg.config_files,
                "config_startup": egg.config_startup,
                "config_stop": egg.config_stop,
                "config_script": egg.config_script,

                "startup": egg.startup,
                "force_outgoing_ip": egg.force_outgoing_ip,

                "features": egg.features,
                "docker_images": egg.docker_images,
                "file_denylist": egg.file_denylist,
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
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/variables", variables::router(state))
        .with_state(state.clone())
}
