use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::server_variable::ServerVariable,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::servers::_server_::GetServer, client::GetPermissionManager},
        },
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        variables: Vec<crate::models::server_variable::ApiServerVariable>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
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
        permissions.has_admin_permission("servers.variables")?;

        let variables = ServerVariable::all_by_server_uuid_egg_uuid(
            &state.database,
            server.uuid,
            server.egg.uuid,
        )
        .await?;

        ApiResponse::json(Response {
            variables: variables
                .into_iter()
                .map(|variable| variable.into_api_object())
                .collect(),
        })
        .ok()
    }
}

mod put {
    use crate::{
        models::server_variable::ServerVariable,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{
                admin::{GetAdminActivityLogger, servers::_server_::GetServer},
                client::GetPermissionManager,
            },
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: String,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        value: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
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
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("server.variables")?;

        let variables = ServerVariable::all_by_server_uuid_egg_uuid(
            &state.database,
            server.uuid,
            server.egg.uuid,
        )
        .await?;

        let variable_uuid = if let Some(variable) = variables
            .iter()
            .find(|variable| variable.variable.env_variable == data.env_variable)
        {
            variable.variable.uuid
        } else {
            return ApiResponse::error("variable not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        };

        let mut validator_variables = HashMap::new();
        validator_variables.reserve(variables.len());

        for variable in variables {
            validator_variables.insert(
                variable.variable.env_variable.clone(),
                (
                    variable.variable.rules,
                    if variable.variable.env_variable == data.env_variable {
                        data.value.clone()
                    } else {
                        variable.value
                    },
                ),
            );
        }

        let validator = match rule_validator::Validator::new(validator_variables) {
            Ok(validator) => validator,
            Err(error) => {
                return ApiResponse::error(&error)
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        if let Err(error) = validator.validate() {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        ServerVariable::create(&state.database, server.uuid, variable_uuid, &data.value).await?;

        activity_logger
            .log(
                "server:variable.update",
                serde_json::json!({
                    "uuid": server.uuid,
                    "variable_uuid": variable_uuid,
                    "env_variable": data.env_variable,
                    "value": data.value,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
