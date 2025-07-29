use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_api_key::UserApiKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{AuthMethod, GetAuthMethod, GetUser, GetUserActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = FORBIDDEN, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "apikey" = String,
            description = "The API key identifier",
            example = "ptlc_1HUayQFz6ba",
        ),
    ))]
    pub async fn route(
        state: GetState,
        auth: GetAuthMethod,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(api_key): Path<String>,
    ) -> ApiResponseResult {
        if matches!(*auth, AuthMethod::ApiKey(_)) {
            return ApiResponse::error("cannot delete api key with api key")
                .with_status(StatusCode::FORBIDDEN)
                .ok();
        }

        let api_key = match UserApiKey::by_key_start(&state.database, user.id, &api_key).await? {
            Some(api_key) => api_key,
            None => {
                return ApiResponse::error("api key not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        UserApiKey::delete_by_id(&state.database, api_key.id).await?;

        activity_logger
            .log(
                "user:api-key.delete",
                serde_json::json!({
                    "identifier": api_key.key_start,
                    "name": api_key.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::user_api_key::UserApiKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{AuthMethod, GetAuthMethod, GetUser, GetUserActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        name: Option<String>,

        #[validate(custom(function = "crate::models::server_subuser::validate_permissions"))]
        permissions: Option<Vec<String>>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = FORBIDDEN, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "apikey" = String,
            description = "The API key identifier",
            example = "ptlc_1HUayQFz6ba",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        auth: GetAuthMethod,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(api_key): Path<String>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if matches!(*auth, AuthMethod::ApiKey(_)) {
            return ApiResponse::error("cannot update api key with api key")
                .with_status(StatusCode::FORBIDDEN)
                .ok();
        }

        let mut api_key = match UserApiKey::by_key_start(&state.database, user.id, &api_key).await?
        {
            Some(api_key) => api_key,
            None => {
                return ApiResponse::error("api key not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        if let Some(name) = data.name {
            api_key.name = name;
        }
        if let Some(permissions) = data.permissions {
            api_key.permissions = permissions;
        }

        match sqlx::query!(
            "UPDATE user_api_keys
            SET name = $1, permissions = $2
            WHERE id = $3",
            api_key.name,
            &api_key.permissions,
            api_key.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("api key with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update api key: {:#?}", err);

                return ApiResponse::error("failed to update api key")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "user:api-key.update",
                serde_json::json!({
                    "identifier": api_key.key_start,
                    "name": api_key.name,
                    "permissions": api_key.permissions,
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
