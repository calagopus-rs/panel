use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::user_security_key::UserSecurityKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use webauthn_rs::prelude::RegisterPublicKeyCredential;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[schema(value_type = serde_json::Value)]
        public_key_credential: RegisterPublicKeyCredential,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(security_key): Path<uuid::Uuid>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
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

        let registration = match security_key.registration {
            Some(registration) => registration,
            None => {
                return ApiResponse::json(ApiError::new_value(&["security key already setup"]))
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
        };

        let webauthn = state.settings.get_webauthn().await?;

        let passkey = match webauthn
            .finish_passkey_registration(&data.public_key_credential, &registration)
        {
            Ok(passkey) => passkey,
            Err(err) => {
                tracing::error!("failed to finish security key registration: {:#?}", err);

                return ApiResponse::error(&format!(
                    "failed to finish security key registration: {}",
                    err
                ))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
            }
        };

        sqlx::query!(
            "UPDATE user_security_keys
            SET credential_id = $2, passkey = $3, registration = NULL
            WHERE user_security_keys.uuid = $1",
            security_key.uuid,
            passkey.cred_id().to_vec(),
            serde_json::to_value(passkey)?
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "user:security-key.create",
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
        .routes(routes!(post::route))
        .with_state(state.clone())
}
