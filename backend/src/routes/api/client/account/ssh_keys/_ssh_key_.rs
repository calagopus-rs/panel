use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_ssh_key::UserSshKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
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
            "sshkey" = String,
            description = "The SSH key fingerprint",
            example = "ncZIBg5GoioMFHMbeyh0h7TzX2Zy3LpoQgRPDbq2qfA",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(ssh_key): Path<String>,
    ) -> ApiResponseResult {
        let ssh_key = match UserSshKey::by_fingerprint(&state.database, user.id, ssh_key).await? {
            Some(ssh_key) => ssh_key,
            None => {
                return ApiResponse::json(ApiError::new_value(&["ssh key not found"]))
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        UserSshKey::delete_by_id(&state.database, ssh_key.id).await?;

        activity_logger
            .log(
                "user:ssh-key.delete",
                serde_json::json!({
                    "fingerprint": ssh_key.fingerprint,
                    "name": ssh_key.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::user_ssh_key::UserSshKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
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
            "sshkey" = String,
            description = "The SSH key fingerprint",
            example = "ncZIBg5GoioMFHMbeyh0h7TzX2Zy3LpoQgRPDbq2qfA",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(ssh_key): Path<String>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let mut ssh_key =
            match UserSshKey::by_fingerprint(&state.database, user.id, ssh_key).await? {
                Some(ssh_key) => ssh_key,
                None => {
                    return ApiResponse::error("ssh key not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if let Some(name) = data.name {
            ssh_key.name = name;
        }

        match sqlx::query!(
            "UPDATE user_ssh_keys SET name = $1 WHERE id = $2",
            ssh_key.name,
            ssh_key.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("ssh key with name or fingerprint already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update ssh key: {:#?}", err);

                return ApiResponse::error("failed to update ssh key")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "user:ssh-key.update",
                serde_json::json!({
                    "fingerprint": ssh_key.fingerprint,
                    "name": ssh_key.name,
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
