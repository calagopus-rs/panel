use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_ssh_key::UserSshKey,
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
            "sshkey" = String,
            description = "The SSH key fingerprint",
            example = "ncZIBg5GoioMFHMbeyh0h7TzX2Zy3LpoQgRPDbq2qfA",
        ),
    ))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(ssh_key): Path<String>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let ssh_key = match UserSshKey::by_fingerprint(&state.database, user.id, ssh_key).await {
            Some(ssh_key) => ssh_key,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["ssh key not found"])),
                );
            }
        };

        UserSshKey::delete_by_id(&state.database, ssh_key.id).await;

        user.log_activity(
            &state.database,
            "user:ssh-key.delete",
            ip,
            auth,
            serde_json::json!({
                "fingerprint": ssh_key.fingerprint,
                "name": ssh_key.name,
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
        models::user_ssh_key::UserSshKey,
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
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(ssh_key): Path<String>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let mut ssh_key = match UserSshKey::by_fingerprint(&state.database, user.id, ssh_key).await
        {
            Some(ssh_key) => ssh_key,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["ssh key not found"])),
                );
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&[
                        "ssh key with name or fingerprint already exists",
                    ])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update ssh key: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update ssh key"])),
                );
            }
        }

        user.log_activity(
            &state.database,
            "user:ssh-key.update",
            ip,
            auth,
            serde_json::json!({
                "fingerprint": ssh_key.fingerprint,
                "name": ssh_key.name,
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
