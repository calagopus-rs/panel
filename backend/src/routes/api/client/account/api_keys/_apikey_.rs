use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_api_key::UserApiKey,
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
            "apikey" = String,
            description = "The API key identifier",
            example = "ptlc_1HUayQFz6ba",
        ),
    ))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(api_key): Path<String>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
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

        user.log_activity(
            &state.database,
            "user:api-key.delete",
            ip,
            auth,
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
            api::client::{GetAuthMethod, GetUser},
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
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
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
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(api_key): Path<String>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
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

        if sqlx::query!(
            "UPDATE user_api_keys
            SET name = $1, permissions = $2
            WHERE id = $3",
            api_key.name,
            &api_key.permissions,
            api_key.id,
        )
        .execute(state.database.write())
        .await
        .is_err()
        {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&["api key with name already exists"])),
            );
        }

        user.log_activity(
            &state.database,
            "user:api-key.update",
            ip,
            auth,
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
