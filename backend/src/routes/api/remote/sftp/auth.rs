use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{server::Server, user::User},
        routes::{ApiError, GetState},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
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
        username: String,
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: uuid::Uuid,
        server: uuid::Uuid,

        permissions: Vec<String>,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mut parts = data.username.splitn(2, '.');
        let user = match parts.next() {
            Some(user) => user,
            None => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["invalid username"])),
                );
            }
        };
        let server = match parts.next() {
            Some(server) => server,
            None => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["invalid username"])),
                );
            }
        };

        let user = match data.r#type {
            AuthenticationType::Password => {
                match User::by_username_password(&state.database, user, &data.password).await {
                    Some(user) => user,
                    None => {
                        return (
                            StatusCode::EXPECTATION_FAILED,
                            axum::Json(ApiError::new_value(&["user not found"])),
                        );
                    }
                }
            }
            AuthenticationType::PublicKey => {
                let public_key = match russh::keys::PublicKey::from_openssh(&data.password) {
                    Ok(public_key) => public_key,
                    Err(_) => {
                        return (
                            StatusCode::EXPECTATION_FAILED,
                            axum::Json(ApiError::new_value(&["invalid public key"])),
                        );
                    }
                };

                match User::by_username_public_key(&state.database, user, public_key).await {
                    Some(user) => user,
                    None => {
                        return (
                            StatusCode::EXPECTATION_FAILED,
                            axum::Json(ApiError::new_value(&["user not found"])),
                        );
                    }
                }
            }
        };
        let server = match Server::by_user_id_identifier(&state.database, user.id, server).await {
            Some(server) => server,
            None => {
                return (
                    StatusCode::EXPECTATION_FAILED,
                    axum::Json(ApiError::new_value(&["server not found"])),
                );
            }
        };

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    user: user.to_uuid(),
                    server: server.uuid,
                    permissions: server
                        .subuser_permissions
                        .unwrap_or_else(|| vec!["*".to_string()]),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
