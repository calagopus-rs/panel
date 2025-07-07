use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{
            nest::Nest,
            nest_egg::{NestEgg, NestEggConfigScript},
            nest_egg_variable::NestEggVariable,
        },
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use indexmap::IndexMap;
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct PayloadVariable {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        name: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        default_value: Option<String>,

        user_viewable: bool,
        user_editable: bool,
        rules: Option<String>,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct PayloadScripts {
        installation: NestEggConfigScript,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        author: String,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        config: HashMap<String, String>,
        #[schema(inline)]
        scripts: PayloadScripts,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        startup: String,
        #[serde(default)]
        force_outgoing_ip: bool,

        #[serde(default)]
        features: Vec<String>,
        docker_images: IndexMap<String, String>,
        #[serde(default)]
        file_denylist: Vec<String>,

        #[schema(inline)]
        variables: Vec<PayloadVariable>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        egg: crate::models::nest_egg::AdminApiNestEgg,
    }

    #[utoipa::path(post, path = "/", responses(
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
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(nest): Path<i32>,
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

        let config_files =
            serde_json::from_str(&data.config.get("files").unwrap_or(&"[]".to_string()))
                .unwrap_or_default();
        let config_startup =
            serde_json::from_str(&data.config.get("startup").unwrap_or(&"{}".to_string()))
                .unwrap_or_default();
        let config_stop =
            serde_json::from_str(&data.config.get("stop").unwrap_or(&"{}".to_string()))
                .unwrap_or_default();

        let egg = match NestEgg::create(
            &state.database,
            nest.id,
            &data.author,
            &data.name,
            if let Some(description) = &data.description {
                if description.is_empty() {
                    None
                } else {
                    Some(description)
                }
            } else {
                None
            },
            config_files,
            config_startup,
            config_stop,
            data.scripts.installation,
            &data.startup,
            data.force_outgoing_ip,
            &data.features,
            data.docker_images,
            &data.file_denylist,
        )
        .await
        {
            Ok(egg) => egg,
            Err(_) => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["egg with name already exists"])),
                );
            }
        };

        for variable in data.variables {
            NestEggVariable::create(
                &state.database,
                egg.id,
                &variable.name,
                variable.description.as_deref(),
                0,
                &variable.env_variable,
                variable.default_value.as_deref(),
                variable.user_viewable,
                variable.user_editable,
                &variable
                    .rules
                    .map(|v| v.split('|').map(String::from).collect::<Vec<String>>())
                    .unwrap_or_default(),
            )
            .await
            .ok();
        }

        user.log_activity(
            &state.database,
            "admin:egg.import",
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
            axum::Json(
                serde_json::to_value(Response {
                    egg: egg.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
