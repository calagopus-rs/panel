use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use chrono::Datelike;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_ssh_key::UserSshKey,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Deserialize, Serialize)]
    #[serde(rename_all = "snake_case")]
    pub enum SshKeyProvider {
        Github,
        Gitlab,
        Launchpad,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        provider: SshKeyProvider,

        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        username: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        ssh_keys: Vec<shared::models::user_ssh_key::ApiUserSshKey>,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("ssh-keys.create")?;

        fn limit_string(string: &str, limit: usize) -> String {
            string.chars().take(limit).collect::<String>()
        }

        let mut ssh_keys = Vec::new();

        match data.provider {
            SshKeyProvider::Github => {
                #[derive(Deserialize)]
                struct GithubSshKey {
                    key: String,
                    created_at: chrono::DateTime<chrono::Utc>,
                }

                let raw_ssh_keys: Vec<GithubSshKey> = match state
                    .client
                    .get(format!(
                        "https://api.github.com/users/{}/keys",
                        data.username
                    ))
                    .send()
                    .await
                {
                    Ok(response) => response.json().await?,
                    Err(_) => {
                        return ApiResponse::error("unable to fetch ssh keys from github")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                };

                for raw_ssh_key in raw_ssh_keys.into_iter().take(50) {
                    let public_key = match russh::keys::PublicKey::from_openssh(&raw_ssh_key.key) {
                        Ok(key) => key,
                        Err(_) => continue,
                    };

                    let ssh_key = match UserSshKey::create(
                        &state.database,
                        user.uuid,
                        &format!(
                            "gh-{}-{}-{:02}-{:02}",
                            limit_string(&data.username, 17),
                            raw_ssh_key.created_at.year(),
                            raw_ssh_key.created_at.month(),
                            raw_ssh_key.created_at.day()
                        ),
                        public_key,
                    )
                    .await
                    {
                        Ok(ssh_key) => ssh_key,
                        Err(err) if err.to_string().contains("unique constraint") => continue,
                        Err(err) => {
                            tracing::error!("failed to create ssh key: {:#?}", err);

                            return ApiResponse::error("failed to create ssh key")
                                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                .ok();
                        }
                    };

                    ssh_keys.push(ssh_key);
                }
            }
            SshKeyProvider::Gitlab => {
                #[derive(Deserialize)]
                struct GitlabSshKey {
                    key: String,
                    title: String,
                    created_at: chrono::DateTime<chrono::Utc>,
                }

                let raw_ssh_keys: Vec<GitlabSshKey> = match state
                    .client
                    .get(format!(
                        "https://gitlab.com/api/v4/users/{}/keys",
                        data.username
                    ))
                    .send()
                    .await
                {
                    Ok(response) => response.json().await?,
                    Err(_) => {
                        return ApiResponse::error("unable to fetch ssh keys from gitlab")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                };

                for raw_ssh_key in raw_ssh_keys.into_iter().take(50) {
                    let public_key = match russh::keys::PublicKey::from_openssh(&raw_ssh_key.key) {
                        Ok(key) => key,
                        Err(_) => continue,
                    };

                    let hostname = raw_ssh_key.title.split("@");
                    let hostname = hostname.last();

                    let ssh_key = match UserSshKey::create(
                        &state.database,
                        user.uuid,
                        &match hostname {
                            Some(hostname) => format!(
                                "gl-{}-{}",
                                limit_string(&data.username, 27),
                                limit_string(hostname, 27 - data.username.chars().count())
                            ),
                            None => format!(
                                "gl-{}-{}-{:02}-{:02}",
                                limit_string(&data.username, 17),
                                raw_ssh_key.created_at.year(),
                                raw_ssh_key.created_at.month(),
                                raw_ssh_key.created_at.day()
                            ),
                        },
                        public_key,
                    )
                    .await
                    {
                        Ok(ssh_key) => ssh_key,
                        Err(err) if err.to_string().contains("unique constraint") => continue,
                        Err(err) => {
                            tracing::error!("failed to create ssh key: {:#?}", err);

                            return ApiResponse::error("failed to create ssh key")
                                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                .ok();
                        }
                    };

                    ssh_keys.push(ssh_key);
                }
            }
            SshKeyProvider::Launchpad => {
                #[derive(Deserialize)]
                struct LaunchpadSshKey {
                    keytype: String,
                    keytext: String,
                }

                #[derive(Deserialize)]
                struct LaunchpadResponse {
                    entries: Vec<LaunchpadSshKey>,
                }

                let raw_ssh_keys: LaunchpadResponse = match state
                    .client
                    .get(format!(
                        "https://api.launchpad.net/1.0/~{}/sshkeys",
                        data.username
                    ))
                    .send()
                    .await
                {
                    Ok(response) => response.json().await?,
                    Err(_) => {
                        return ApiResponse::error("unable to fetch ssh keys from launchpad")
                            .with_status(StatusCode::EXPECTATION_FAILED)
                            .ok();
                    }
                };

                for (i, raw_ssh_key) in raw_ssh_keys.entries.into_iter().take(50).enumerate() {
                    let public_key = match russh::keys::PublicKey::from_openssh(&format!(
                        "ssh-{} {}",
                        raw_ssh_key.keytype.to_lowercase(),
                        raw_ssh_key.keytext
                    )) {
                        Ok(key) => key,
                        Err(_) => continue,
                    };

                    let ssh_key = match UserSshKey::create(
                        &state.database,
                        user.uuid,
                        &format!("lp-{}-{:02}", limit_string(&data.username, 25), i + 1),
                        public_key,
                    )
                    .await
                    {
                        Ok(ssh_key) => ssh_key,
                        Err(err) if err.to_string().contains("unique constraint") => continue,
                        Err(err) => {
                            tracing::error!("failed to create ssh key: {:#?}", err);

                            return ApiResponse::error("failed to create ssh key")
                                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                .ok();
                        }
                    };

                    ssh_keys.push(ssh_key);
                }
            }
        }

        activity_logger
            .log(
                "user:ssh-key.import",
                serde_json::json!({
                    "provider": data.provider,
                    "username": data.username,
                    "ssh_keys": ssh_keys
                        .iter()
                        .map(|key| serde_json::json!({
                            "uuid": key.uuid,
                            "fingerprint": key.fingerprint
                        }))
                        .collect::<Vec<_>>()
                }),
            )
            .await;

        ApiResponse::json(Response {
            ssh_keys: ssh_keys
                .into_iter()
                .map(|ssh_key| ssh_key.into_api_object())
                .collect(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
