use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod challenge;

mod delete {
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel,
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_security_key::UserSecurityKey,
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
            "security_key" = uuid::Uuid,
            description = "The Security key ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(security_key): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        permissions.has_user_permission("security-keys.delete")?;

        let security_key =
            match UserSecurityKey::by_user_uuid_uuid(&state.database, user.uuid, security_key)
                .await?
            {
                Some(security_key) => security_key,
                None => {
                    return ApiResponse::json(ApiError::new_value(&["security key not found"]))
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        security_key.delete(&state.database, ()).await?;

        if security_key.registration.is_none() {
            activity_logger
                .log(
                    "security-key:delete",
                    serde_json::json!({
                        "uuid": security_key.uuid,
                        "name": security_key.name,
                    }),
                )
                .await;
        }

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_security_key::UserSecurityKey,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        name: Option<compact_str::CompactString>,
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
            "security_key" = uuid::Uuid,
            description = "The Security key ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(security_key): Path<uuid::Uuid>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("security-keys.update")?;

        let mut security_key =
            match UserSecurityKey::by_user_uuid_uuid(&state.database, user.uuid, security_key)
                .await?
            {
                Some(security_key) => security_key,
                None => {
                    return ApiResponse::error("security key not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if security_key.registration.is_some() {
            return ApiResponse::error("security key not setup yet")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(name) = data.name {
            security_key.name = name;
        }

        match sqlx::query!(
            "UPDATE user_security_keys
            SET name = $1
            WHERE user_security_keys.uuid = $2",
            &security_key.name,
            security_key.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("ssh key with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update security key: {:?}", err);

                return ApiResponse::error("failed to update security key")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "user:security-key.update",
                serde_json::json!({
                    "uuid": security_key.uuid,
                    "name": security_key.name,
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
        .nest("/challenge", challenge::router(state))
        .with_state(state.clone())
}
