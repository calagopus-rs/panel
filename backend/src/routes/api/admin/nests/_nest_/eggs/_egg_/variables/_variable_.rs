use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::routes::api::admin::nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg};
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger,
            nest_egg_variable::NestEggVariable, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
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
        (
            "variable" = uuid::Uuid,
            description = "The variable ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        Path((_nest, _egg, variable)): Path<(uuid::Uuid, uuid::Uuid, uuid::Uuid)>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("eggs.update")?;

        let egg_variable =
            match NestEggVariable::by_egg_uuid_uuid(&state.database, egg.uuid, variable).await? {
                Some(variable) => variable,
                None => {
                    return ApiResponse::error("variable not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        egg_variable.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "nest:egg.variable.delete",
                serde_json::json!({
                    "uuid": variable,
                    "nest_uuid": nest.uuid,
                    "egg_uuid": egg.uuid,

                    "name": egg_variable.name,
                    "env_variable": egg_variable.env_variable,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::nests::_nest_::{GetNest, eggs::_egg_::GetNestEgg};
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            admin_activity::GetAdminActivityLogger, nest_egg_variable::NestEggVariable,
            user::GetPermissionManager,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,
        order: Option<i16>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        default_value: Option<String>,

        user_viewable: Option<bool>,
        user_editable: Option<bool>,
        #[validate(custom(function = "rule_validator::validate_rules"))]
        rules: Option<Vec<compact_str::CompactString>>,
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
        (
            "variable" = uuid::Uuid,
            description = "The variable ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        Path((_nest, _egg, variable)): Path<(uuid::Uuid, uuid::Uuid, uuid::Uuid)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("eggs.update")?;

        let mut egg_variable =
            match NestEggVariable::by_egg_uuid_uuid(&state.database, egg.uuid, variable).await? {
                Some(variable) => variable,
                None => {
                    return ApiResponse::error("variable not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
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

        match sqlx::query!(
            "UPDATE nest_egg_variables
            SET
                name = $1, description = $2, order_ = $3, env_variable = $4,
                default_value = $5, user_viewable = $6, user_editable = $7, rules = $8
            WHERE nest_egg_variables.uuid = $9",
            &egg_variable.name,
            egg_variable.description.as_deref(),
            egg_variable.order,
            &egg_variable.env_variable,
            egg_variable.default_value,
            egg_variable.user_viewable,
            egg_variable.user_editable,
            &egg_variable.rules as &[compact_str::CompactString],
            egg_variable.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("variable with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create variable: {:?}", err);

                return ApiResponse::error("failed to create variable")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "nest:egg.variable.update",
                serde_json::json!({
                    "uuid": egg_variable.uuid,
                    "nest_uuid": nest.uuid,
                    "egg_uuid": egg.uuid,

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

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
