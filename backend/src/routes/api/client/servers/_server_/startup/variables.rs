use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::server_variable::ServerVariable,
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
    };
    use axum::http::StatusCode;
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
    pub async fn route(state: GetState, server: GetServer) -> ApiResponseResult {
        if let Err(error) = server.has_permission("startup.read") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let variables =
            ServerVariable::all_by_server_id_egg_id(&state.database, server.id, server.egg.id)
                .await?;

        ApiResponse::json(Response {
            variables: variables
                .into_iter()
                .filter(|variable| variable.variable.user_viewable)
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
        routes::{ApiError, GetState, api::client::servers::_server_::GetServer},
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
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Err(error) = server.has_permission("startup.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let variables =
            ServerVariable::all_by_server_id_egg_id(&state.database, server.id, server.egg.id)
                .await?;

        let variable_id = if let Some(variable) = variables
            .iter()
            .find(|variable| variable.variable.env_variable == data.env_variable)
        {
            if !variable.variable.user_editable {
                return ApiResponse::error("variable is not editable")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }

            variable.variable.id
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

        ServerVariable::create(&state.database, server.id, variable_id, &data.value).await?;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
