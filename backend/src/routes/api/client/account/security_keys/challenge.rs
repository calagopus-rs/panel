use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{GetState, api::client::GetUser},
    };
    use jwt::ToBase64;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseOptionsRp {
        name: String,
        id: String,
    }

    #[derive(ToSchema, Serialize)]
    #[serde(rename_all = "camelCase")]
    struct ResponseOptionsUser<'a> {
        id: &'a str,
        name: String,
        display_name: String,
    }

    #[derive(ToSchema, Serialize)]
    struct ResponseOptionsPubKeyCredParam {
        r#type: String,
        alg: i64,
    }

    #[derive(ToSchema, Serialize)]
    #[serde(rename_all = "camelCase")]
    struct ResponseOptions<'a> {
        challenge: &'a str,
        #[schema(inline)]
        rp: ResponseOptionsRp,
        #[schema(inline)]
        user: ResponseOptionsUser<'a>,
        #[schema(inline)]
        pub_key_cred_params: Vec<ResponseOptionsPubKeyCredParam>,
        timeout: Option<u32>,
        attestation: &'static str,
    }

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        options: ResponseOptions<'a>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, user: GetUser) -> ApiResponseResult {
        let webauthn = state.settings.get_webauthn().await?;

        let credential_ids = sqlx::query!(
            "SELECT user_security_keys.credential_id
            FROM user_security_keys
            WHERE user_security_keys.user_uuid = $1",
            user.uuid
        )
        .fetch_all(state.database.read())
        .await?;

        let (response, registration) = webauthn.start_passkey_registration(
            user.uuid,
            &user.email,
            &user.username,
            Some(
                credential_ids
                    .into_iter()
                    .map(|id| id.credential_id.into())
                    .collect(),
            ),
        )?;

        ApiResponse::json(Response {
            options: ResponseOptions {
                challenge: &response.public_key.challenge.to_base64()?,
                rp: ResponseOptionsRp {
                    name: response.public_key.rp.name,
                    id: response.public_key.rp.id,
                },
                user: ResponseOptionsUser {
                    id: &response.public_key.user.id.to_base64()?,
                    name: user.0.email,
                    display_name: user.0.username,
                },
                pub_key_cred_params: response
                    .public_key
                    .pub_key_cred_params
                    .into_iter()
                    .map(|param| ResponseOptionsPubKeyCredParam {
                        r#type: param.type_,
                        alg: param.alg,
                    })
                    .collect(),
                timeout: response.public_key.timeout,
                attestation: "none",
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
