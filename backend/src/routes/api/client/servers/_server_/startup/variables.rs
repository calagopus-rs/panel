use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::server_variable::ServerVariable,
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
    pub async fn route(
        state: GetState,
        server: GetServer,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("startup.read") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let variables =
            ServerVariable::all_by_server_id_egg_id(&state.database, server.id, server.egg.id)
                .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    variables: variables
                        .into_iter()
                        .filter(|variable| variable.variable.user_viewable)
                        .map(|variable| variable.into_api_object())
                        .collect(),
                })
                .unwrap(),
            ),
        )
    }
}

mod put {
    use crate::{
        models::server_variable::ServerVariable,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("startup.update") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let variables =
            ServerVariable::all_by_server_id_egg_id(&state.database, server.id, server.egg.id)
                .await;

        let variable_id = if let Some(variable) = variables
            .iter()
            .find(|variable| variable.variable.env_variable == data.env_variable)
        {
            if !variable.variable.user_editable {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["variable is not editable"])),
                );
            }

            variable.variable.id
        } else {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["variable not found"])),
            );
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
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&[&error])),
                );
            }
        };

        if let Err(error) = validator.validate() {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        ServerVariable::create(&state.database, server.id, variable_id, &data.value)
            .await
            .unwrap();

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
