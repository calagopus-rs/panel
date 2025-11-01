use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::GetServer, server_activity::ServerActivity, server_variable::ServerVariable,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use std::collections::HashMap;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: String,
        #[validate(length(max = 4096))]
        #[schema(max_length = 4096)]
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
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

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
            if !variable.variable.user_editable {
                return ApiResponse::error("variable is not editable")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }

            variable.variable.uuid
        } else {
            return ApiResponse::error("variable not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        };

        let mut validator_variables = HashMap::new();
        validator_variables.reserve(variables.len());

        for variable in variables.iter() {
            validator_variables.insert(
                variable.variable.env_variable.as_str(),
                (
                    variable.variable.rules.as_slice(),
                    if variable.variable.env_variable == data.env_variable {
                        data.value.as_str()
                    } else {
                        variable.value.as_str()
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

        if let Err(err) = ServerActivity::log_remote(
            &state.database,
            server.uuid,
            None,
            "server:startup.variables",
            None,
            serde_json::json!({
                "variables": [
                    {
                        "env_variable": data.env_variable,
                        "value": data.value,
                    }
                ]
            }),
            chrono::Utc::now(),
        )
        .await
        {
            tracing::warn!(
                server = %server.uuid,
                "failed to log remote activity for server: {:#?}",
                err
            );
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
