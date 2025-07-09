use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_api_key::UserApiKey,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if matches!(*auth, AuthMethod::ApiKey(_)) {
            return (
                StatusCode::FORBIDDEN,
                axum::Json(ApiError::new_value(&["cannot delete api key with api key"])),
            );
        }

        let api_key = match UserApiKey::by_key_start(&state.database, user.id, &api_key).await {
            Some(api_key) => api_key,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["api key not found"])),
                );
            }
        };

        UserApiKey::delete_by_id(&state.database, api_key.id).await;

        activity_logger
            .log(
                "user:api-key.delete",
                serde_json::json!({
                    "identifier": api_key.key_start,
                    "name": api_key.name,
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
        models::user_api_key::UserApiKey,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if matches!(*auth, AuthMethod::ApiKey(_)) {
            return (
                StatusCode::FORBIDDEN,
                axum::Json(ApiError::new_value(&["cannot update api key with api key"])),
            );
        }

        let mut api_key = match UserApiKey::by_key_start(&state.database, user.id, &api_key).await {
            Some(api_key) => api_key,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["api key not found"])),
                );
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["api key with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update api key: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update api key"])),
                );
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
