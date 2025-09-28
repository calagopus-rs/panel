use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{
            nest_egg::{NestEgg, NestEggConfigScript},
            nest_egg_variable::NestEggVariable,
        },
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{
                admin::{GetAdminActivityLogger, nests::_nest_::GetNest},
                client::GetPermissionManager,
            },
        },
    };
    use axum::http::StatusCode;
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
        #[schema(inline)]
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
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("eggs.create")?;

        let config_files =
            serde_json::from_str(data.config.get("files").unwrap_or(&"[]".to_string()))
                .unwrap_or_default();
        let config_startup =
            serde_json::from_str(data.config.get("startup").unwrap_or(&"{}".to_string()))
                .unwrap_or_default();
        let config_stop =
            serde_json::from_str(data.config.get("stop").unwrap_or(&"{}".to_string()))
                .unwrap_or_default();

        let egg = match NestEgg::create(
            &state.database,
            nest.uuid,
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
            crate::models::nest_egg::NestEggConfigAllocations {
                user_self_assign: Default::default(),
            },
            &data.startup,
            data.force_outgoing_ip,
            &data.features,
            data.docker_images,
            &data.file_denylist,
        )
        .await
        {
            Ok(egg) => egg,
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("egg with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create egg: {:#?}", err);

                return ApiResponse::error("failed to create egg")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        for variable in data.variables {
            let rules = variable
                .rules
                .as_ref()
                .map(|v| v.split('|').map(String::from).collect::<Vec<String>>())
                .unwrap_or_default();

            if rule_validator::validate_rules(&rules).is_err() {
                continue;
            }

            NestEggVariable::create(
                &state.database,
                egg.uuid,
                &variable.name,
                variable.description.as_deref(),
                0,
                &variable.env_variable,
                variable.default_value.as_deref(),
                variable.user_viewable,
                variable.user_editable,
                &rules,
            )
            .await
            .ok();
        }

        activity_logger
            .log(
                "nest:egg.create",
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

                    "features": egg.features,
                    "docker_images": egg.docker_images,
                    "file_denylist": egg.file_denylist,
                }),
            )
            .await;

        ApiResponse::json(Response {
            egg: egg.into_admin_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
