use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::{nest::Nest, nest_egg::NestEgg, nest_egg_variable::NestEggVariable},
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
        (
            "variable" = i32,
            description = "The variable ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path((nest, egg, variable)): Path<(i32, i32, i32)>,
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

        let egg_variable =
            match NestEggVariable::by_egg_id_id(&state.database, egg.id, variable).await {
                Some(variable) => variable,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["variable not found"])),
                    );
                }
            };

        NestEggVariable::delete_by_id(&state.database, egg_variable.id).await;

        user.log_activity(
            &state.database,
            "admin:egg.delete-variable",
            ip,
            auth,
            serde_json::json!({
                "nest": nest.name,
                "egg": egg.name,

                "name": egg_variable.name,
                "env_variable": egg_variable.env_variable,
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
        models::{nest::Nest, nest_egg::NestEgg, nest_egg_variable::NestEggVariable},
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,
        order: Option<i16>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        default_value: Option<String>,

        user_viewable: Option<bool>,
        user_editable: Option<bool>,
        rules: Option<Vec<String>>,
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
        (
            "variable" = i32,
            description = "The variable ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path((nest, egg, variable)): Path<(i32, i32, i32)>,
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

        let egg = match NestEgg::by_nest_id_id(&state.database, nest.id, egg).await {
            Some(egg) => egg,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["egg not found"])),
                );
            }
        };

        let mut egg_variable =
            match NestEggVariable::by_egg_id_id(&state.database, egg.id, variable).await {
                Some(variable) => variable,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["variable not found"])),
                    );
                }
            };

        if let Some(name) = data.name {
            egg_variable.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                egg_variable.description = None;
            } else {
                egg_variable.description = Some(description);
            }
        }
        if let Some(order) = data.order {
            egg_variable.order = order;
        }
        if let Some(env_variable) = data.env_variable {
            egg_variable.env_variable = env_variable;
        }
        if let Some(default_value) = data.default_value {
            if default_value.is_empty() {
                egg_variable.default_value = None;
            } else {
                egg_variable.default_value = Some(default_value);
            }
        }
        if let Some(user_viewable) = data.user_viewable {
            egg_variable.user_viewable = user_viewable;
        }
        if let Some(user_editable) = data.user_editable {
            egg_variable.user_editable = user_editable;
        }
        if let Some(rules) = data.rules {
            egg_variable.rules = rules;
        }

        if sqlx::query!(
            "UPDATE nest_egg_variables
            SET
                name = $1, description = $2, order_ = $3, env_variable = $4,
                default_value = $5, user_viewable = $6, user_editable = $7, rules = $8
            WHERE id = $9",
            egg_variable.name,
            egg_variable.description,
            egg_variable.order,
            egg_variable.env_variable,
            egg_variable.default_value,
            egg_variable.user_viewable,
            egg_variable.user_editable,
            &egg_variable.rules,
            egg_variable.id,
        )
        .execute(state.database.write())
        .await
        .is_err()
        {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&["egg with name already exists"])),
            );
        }

        user.log_activity(
            &state.database,
            "admin:egg.update-variable",
            ip,
            auth,
            serde_json::json!({
                "nest": nest.name,
                "egg": egg.name,

                "name": egg_variable.name,
                "description": egg_variable.description,
                "order": egg_variable.order,

                "env_variable": egg_variable.env_variable,
                "default_value": egg_variable.default_value,

                "user_viewable": egg_variable.user_viewable,
                "user_editable": egg_variable.user_editable,
                "rules": egg_variable.rules,
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
        .with_state(state.clone())
}
