use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _sshkey_;

mod get {
    use crate::{
        models::{Pagination, user_ssh_key::UserSshKey},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Params {
        #[validate(range(min = 1))]
        #[serde(default = "Pagination::default_page")]
        page: i64,
        #[validate(range(min = 1, max = 100))]
        #[serde(default = "Pagination::default_per_page")]
        per_page: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        api_keys: Pagination<crate::models::user_ssh_key::ApiUserSshKey>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let ssh_keys = UserSshKey::by_user_id_with_pagination(
            &state.database,
            user.id,
            params.page,
            params.per_page,
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    api_keys: Pagination {
                        total: ssh_keys.total,
                        per_page: ssh_keys.per_page,
                        page: ssh_keys.page,
                        data: ssh_keys
                            .data
                            .into_iter()
                            .map(|ssh_key| ssh_key.into_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::user_ssh_key::UserSshKey,
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        name: String,

        public_key: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        ssh_key: crate::models::user_ssh_key::ApiUserSshKey,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let public_key = match russh::keys::PublicKey::from_openssh(&data.public_key) {
            Ok(key) => key,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["invalid public key"])),
                );
            }
        };

        let ssh_key =
            match UserSshKey::create(&state.database, user.id, &data.name, public_key).await {
                Ok(ssh_key) => ssh_key,
                Err(_) => {
                    return (
                        StatusCode::CONFLICT,
                        axum::Json(ApiError::new_value(&[
                            "ssh key with name or fingerprint already exists",
                        ])),
                    );
                }
            };

        user.log_activity(
            &state.database,
            "user:ssh-key.create",
            ip,
            serde_json::json!({
                "fingerprint": ssh_key.fingerprint,
                "name": ssh_key.name,
            }),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    ssh_key: ssh_key.into_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{sshkey}", _sshkey_::router(state))
        .with_state(state.clone())
}
