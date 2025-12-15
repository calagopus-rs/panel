use super::State;
use axum::{
    body::Body,
    extract::{Path, Query},
    http::StatusCode,
    routing::get,
};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, RedirectUrl, TokenResponse, TokenUrl,
    basic::BasicClient,
};
use rand::distr::SampleString;
use rustis::commands::StringCommands;
use serde::Deserialize;
use shared::{
    GetState,
    models::{
        ByUuid, oauth_provider::OAuthProvider, user::User, user_activity::UserActivity,
        user_oauth_link::UserOAuthLink, user_session::UserSession,
    },
    response::ApiResponse,
};
use tower_cookies::{Cookie, Cookies};
use utoipa_axum::router::OpenApiRouter;

#[derive(Deserialize)]
pub struct Params {
    code: String,
    state: String,
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .route("/", get(|state: GetState,
            ip: shared::GetIp,
            headers: axum::http::HeaderMap,
            cookies: Cookies,
            params: Query<Params>,
            Path(oauth_provider): Path<uuid::Uuid>| async move {
            let oauth_provider =
                match OAuthProvider::by_uuid_optional_cached(&state.database, oauth_provider).await? {
                    Some(oauth_provider) => oauth_provider,
                    None => {
                        return ApiResponse::error("oauth provider not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }
                };

            if !oauth_provider.enabled {
                return ApiResponse::error("oauth provider not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }

            if state
                .cache
                .client
                .get::<String, u16>(format!("oauth_state::{}", params.state))
                .await
                .is_err()
            {
                return ApiResponse::error("oauth csrf state not found, please try again")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }

            let settings = state.settings.get().await;

            let client = BasicClient::new(ClientId::new(oauth_provider.client_id.to_string()))
                .set_client_secret(ClientSecret::new(
                    state
                        .database
                        .decrypt(oauth_provider.client_secret.clone())
                        .await?.into(),
                ))
                .set_auth_uri(AuthUrl::new(oauth_provider.auth_url.clone())?)
                .set_token_uri(TokenUrl::new(oauth_provider.token_url.clone())?)
                .set_auth_type(if oauth_provider.basic_auth {
                    oauth2::AuthType::BasicAuth
                } else {
                    oauth2::AuthType::RequestBody
                })
                .set_redirect_uri(RedirectUrl::new(format!(
                    "{}/api/auth/oauth/{}",
                    settings.app.url.trim_end_matches('/'),
                    oauth_provider.uuid
                ))?);

            drop(settings);

            if let Some(session_id) = cookies.get("session") {
                if !oauth_provider.user_manageable {
                    return ApiResponse::error("you cannot link with this oauth provider")
                        .with_status(StatusCode::CONFLICT)
                        .ok();
                }

                if session_id.value().len() != 81 {
                    return ApiResponse::error("invalid authorization cookie")
                        .with_status(StatusCode::UNAUTHORIZED)
                        .ok();
                }

                let (user, session) =
                    match User::by_session_cached(&state.database, session_id.value()).await? {
                        Some(data) => data,
                        None => {
                            return ApiResponse::error("invalid session")
                                .with_status(StatusCode::UNAUTHORIZED)
                                .ok();
                        }
                    };

                state
                    .database
                    .batch_action("update_user_session", session.uuid, {
                        let state = state.clone();
                        let user_agent = shared::utils::slice_up_to(
                            headers
                                .get("User-Agent")
                                .and_then(|ua| ua.to_str().ok())
                                .unwrap_or("unknown"),
                            255,
                        )
                        .to_string();

                        async move {
                            if let Err(err) = sqlx::query!(
                                "UPDATE user_sessions
                                SET ip = $1, user_agent = $2, last_used = NOW()
                                WHERE user_sessions.uuid = $3",
                                sqlx::types::ipnetwork::IpNetwork::from(ip.0),
                                user_agent,
                                session.uuid,
                            )
                            .execute(state.database.write())
                            .await
                            {
                                tracing::warn!(user = %user.uuid, "failed to update user session: {:?}", err);
                                sentry::capture_error(&err);
                            }
                        }
                    })
                    .await;

                let settings = state.settings.get().await;
                let secure = settings.app.url.starts_with("https://");
                drop(settings);

                cookies.add(
                    Cookie::build(("session", session_id.value().to_string()))
                        .http_only(true)
                        .same_site(tower_cookies::cookie::SameSite::Lax)
                        .secure(secure)
                        .path("/")
                        .expires(
                            tower_cookies::cookie::time::OffsetDateTime::now_utc()
                                + tower_cookies::cookie::time::Duration::days(30),
                        )
                        .build(),
                );

                let token = client
                    .exchange_code(AuthorizationCode::new(params.0.code))
                    .request_async(&state.client)
                    .await?;

                let info: serde_json::Value = state
                    .client
                    .get(&oauth_provider.info_url)
                    .bearer_auth(token.access_token().secret())
                    .send()
                    .await?
                    .json()
                    .await?;

                let identifier = match oauth_provider.extract_identifier(&info) {
                    Ok(identifier) => identifier,
                    Err(err) => {
                        return ApiResponse::error(&err.to_string())
                            .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                            .ok();
                    }
                };

                UserOAuthLink::create(&state.database, user.uuid, oauth_provider.uuid, &identifier)
                    .await?;

                if let Err(err) = UserActivity::log(
                    &state.database,
                    user.uuid,
                    None,
                    "account:oauth-links.create",
                    Some(ip.0.into()),
                    serde_json::json!({
                        "provider": oauth_provider.name,
                        "identifier": identifier,
                    }),
                )
                .await
                {
                    tracing::warn!(user = %user.uuid, "failed to log user activity: {:?}", err);
                }

                let settings = state.settings.get().await;

                ApiResponse::new(Body::empty())
                    .with_header("Location", &format!("{}/account/oauth-links", settings.app.url.trim_end_matches('/')))
                    .with_status(StatusCode::TEMPORARY_REDIRECT)
                    .ok()
            } else {
                let token = client
                    .exchange_code(AuthorizationCode::new(params.0.code))
                    .request_async(&state.client)
                    .await?;

                let info: serde_json::Value = state
                    .client
                    .get(&oauth_provider.info_url)
                    .bearer_auth(token.access_token().secret())
                    .send()
                    .await?
                    .json()
                    .await?;

                let identifier = match oauth_provider.extract_identifier(&info) {
                    Ok(identifier) => identifier,
                    Err(err) => {
                        return ApiResponse::error(&err.to_string())
                            .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                            .ok();
                    }
                };

                match UserOAuthLink::by_oauth_provider_uuid_identifier(&state.database, oauth_provider.uuid, &identifier).await? {
                    Some(oauth_link) => {
                        let user = oauth_link.user.fetch(&state.database).await?;

                        let key = UserSession::create(
                            &state.database,
                            user.uuid,
                            ip.0.into(),
                            headers
                                .get("User-Agent")
                                .map(|ua| shared::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                                .unwrap_or("unknown"),
                        )
                        .await?;

                        let settings = state.settings.get().await;
                        let secure = settings.app.url.starts_with("https://");
                        drop(settings);

                        cookies.add(
                            Cookie::build(("session", key))
                                .http_only(true)
                                .same_site(tower_cookies::cookie::SameSite::Strict)
                                .secure(secure)
                                .path("/")
                                .expires(
                                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                                        + tower_cookies::cookie::time::Duration::days(30),
                                )
                                .build(),
                        );

                        if let Err(err) = UserActivity::log(
                            &state.database,
                            user.uuid,
                            None,
                            "auth:success",
                            Some(ip.0.into()),
                            serde_json::json!({
                                "using": "oauth2",
                                "oauth_provider": oauth_provider.name,
                            }),
                        )
                        .await
                        {
                            tracing::warn!(user = %user.uuid, "failed to log user activity: {:?}", err);
                        }

                        sqlx::query!(
                            "UPDATE user_oauth_links
                            SET last_used = NOW()
                            WHERE user_oauth_links.uuid = $1",
                            oauth_link.uuid
                        )
                        .execute(state.database.write())
                        .await?;

                        let settings = state.settings.get().await;

                        ApiResponse::new(Body::empty())
                            .with_header("Location", &settings.app.url)
                            .with_status(StatusCode::TEMPORARY_REDIRECT)
                            .ok()
                    }
                    None => {
                        let settings = state.settings.get().await;
                        if !settings.app.registration_enabled {
                            return ApiResponse::error("registration is disabled")
                                .with_status(StatusCode::BAD_REQUEST)
                                .ok();
                        }
                        let secure = settings.app.url.starts_with("https://");

                        let username = match oauth_provider.extract_username(&info) {
                            Ok(username) => username,
                            Err(err) => {
                                return ApiResponse::error(&err.to_string())
                                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                    .ok();
                            }
                        };
                        let email = match oauth_provider.extract_email(&info) {
                            Ok(email) => email,
                            Err(err) => {
                                return ApiResponse::error(&err.to_string())
                                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                    .ok();
                            }
                        };
                        let name_first = match oauth_provider.extract_name_first(&info) {
                            Ok(name_first) => name_first,
                            Err(err) => {
                                return ApiResponse::error(&err.to_string())
                                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                    .ok();
                            }
                        };
                        let name_last = match oauth_provider.extract_name_last(&info) {
                            Ok(name_last) => name_last,
                            Err(err) => {
                                return ApiResponse::error(&err.to_string())
                                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                    .ok();
                            }
                        };

                        let password = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 16);
                        let user = match User::create(
                            &state.database,
                            None,
                            None,
                            &username,
                            &email,
                            &name_first,
                            &name_last,
                            &password,
                            false,
                            &settings.app.language,
                        )
                        .await
                        {
                            Ok(user_uuid) => User::by_uuid(&state.database, user_uuid).await?,
                            Err(err) if err.is_unique_violation() => {
                                return ApiResponse::error("user with username or email already exists")
                                    .with_status(StatusCode::BAD_REQUEST)
                                    .ok();
                            }
                            Err(err) => {
                                tracing::error!("failed to create user: {:?}", err);

                                return ApiResponse::error("failed to create user")
                                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                                    .ok();
                            }
                        };

                        drop(settings);

                        let key = UserSession::create(
                            &state.database,
                            user.uuid,
                            ip.0.into(),
                            headers
                                .get("User-Agent")
                                .map(|ua| shared::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                                .unwrap_or("unknown"),
                        )
                        .await?;

                        cookies.add(
                            Cookie::build(("session", key))
                                .http_only(true)
                                .same_site(tower_cookies::cookie::SameSite::Strict)
                                .secure(secure)
                                .path("/")
                                .expires(
                                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                                        + tower_cookies::cookie::time::Duration::days(30),
                                )
                                .build(),
                        );

                        let settings = state.settings.get().await;

                        ApiResponse::new(Body::empty())
                            .with_header("Location", &settings.app.url)
                            .with_status(StatusCode::TEMPORARY_REDIRECT)
                            .ok()
                    }
                }
            }
        }))
        .with_state(state.clone())
}
