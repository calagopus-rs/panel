use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{server::Server, user::User},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    #[serde(rename_all = "snake_case")]
    pub enum AuthenticationType {
        Password,
        PublicKey,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        r#type: AuthenticationType,
        username: compact_str::CompactString,
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        user: uuid::Uuid,
        server: uuid::Uuid,

        permissions: Vec<&'a str>,
        ignored_files: &'a [compact_str::CompactString],
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let mut parts = data.username.splitn(2, '.');
        let user = match parts.next() {
            Some(user) => user,
            None => {
                return ApiResponse::error("invalid username")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };
        let server = match parts.next() {
            Some(server) => server,
            None => {
                return ApiResponse::error("invalid username")
                    .with_status(StatusCode::EXPECTATION_FAILED)
                    .ok();
            }
        };

        let user = match data.r#type {
            AuthenticationType::Password => {
                match User::by_username_password(&state.database, user, &data.password).await? {
                    Some(user) => user,
                    None => {
                        return ApiResponse::error("user not found")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                }
            }
            AuthenticationType::PublicKey => {
                let public_key = match russh::keys::PublicKey::from_openssh(&data.password) {
                    Ok(public_key) => public_key,
                    Err(_) => {
                        return ApiResponse::error("invalid public key")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                };

                match User::by_username_public_key(&state.database, user, public_key).await? {
                    Some(user) => user,
                    None => {
                        return ApiResponse::error("user not found")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                }
            }
        };
        let server = match Server::by_user_identifier_cached(&state.database, &user, server).await?
        {
            Some(server) => server,
            None => {
                return ApiResponse::error("server not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        ApiResponse::json(Response {
            user: user.uuid,
            server: server.uuid,
            permissions: server.wings_permissions(&user),
            ignored_files: server.subuser_ignored_files.as_deref().unwrap_or(&[]),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
