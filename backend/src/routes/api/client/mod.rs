use super::{ApiError, GetState, State};
use crate::models::{user::User, user_api_key::UserApiKey, user_session::UserSession};
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};
use tower_cookies::{Cookie, Cookies};
use utoipa_axum::router::OpenApiRouter;

mod account;
mod permissions;
mod servers;

#[derive(Clone)]
pub enum AuthMethod {
    Session(UserSession),
    ApiKey(UserApiKey),
}

pub type GetUser = crate::extract::ConsumingExtension<User>;
pub type GetAuthMethod = crate::extract::ConsumingExtension<AuthMethod>;

pub async fn auth(
    state: GetState,
    ip: crate::GetIp,
    cookies: Cookies,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Some(session_id) = cookies.get("session") {
        if session_id.value().len() != 81 {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid authorization cookie"]))
                        .unwrap(),
                ))
                .unwrap());
        }

        let user = User::by_session(&state.database, session_id.value()).await;
        let (user, session) = match user {
            Some(data) => data,
            None => {
                return Ok(Response::builder()
                    .status(StatusCode::UNAUTHORIZED)
                    .header("Content-Type", "application/json")
                    .body(Body::from(
                        serde_json::to_string(&ApiError::new_value(&["invalid session"])).unwrap(),
                    ))
                    .unwrap());
            }
        };

        sqlx::query!(
            "UPDATE user_sessions
            SET ip = $1, user_agent = $2, last_used = $3
            WHERE id = $4",
            sqlx::types::ipnetwork::IpNetwork::from(ip.0),
            crate::utils::slice_up_to(
                req.headers()
                    .get("User-Agent")
                    .map(|ua| ua.to_str().unwrap_or("unknown"))
                    .unwrap_or("unknown"),
                255,
            ),
            chrono::Utc::now().naive_utc(),
            session.id,
        )
        .execute(state.database.write())
        .await
        .unwrap();

        cookies.add(
            Cookie::build(("session", session_id.value().to_string()))
                .http_only(true)
                .same_site(tower_cookies::cookie::SameSite::Lax)
                .secure(true)
                .path("/")
                .expires(
                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                        + tower_cookies::cookie::time::Duration::days(30),
                )
                .build(),
        );

        req.extensions_mut().insert(user);
        req.extensions_mut().insert(AuthMethod::Session(session));
    } else if let Some(api_token) = req.headers().get("Authorization") {
        if api_token.len() != 55 {
            return Ok(Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid authorization header"]))
                        .unwrap(),
                ))
                .unwrap());
        }

        let user = User::by_api_key(
            &state.database,
            api_token
                .to_str()
                .unwrap_or("")
                .trim_start_matches("Bearer "),
        )
        .await;
        let (user, api_key) = match user {
            Some(data) => data,
            None => {
                return Ok(Response::builder()
                    .status(StatusCode::UNAUTHORIZED)
                    .header("Content-Type", "application/json")
                    .body(Body::from(
                        serde_json::to_string(&ApiError::new_value(&["invalid api key"])).unwrap(),
                    ))
                    .unwrap());
            }
        };

        sqlx::query!(
            "UPDATE user_api_keys
            SET last_used = $1
            WHERE id = $2",
            chrono::Utc::now().naive_utc(),
            api_key.id,
        )
        .execute(state.database.write())
        .await
        .unwrap();

        req.extensions_mut().insert(user);
        req.extensions_mut().insert(AuthMethod::ApiKey(api_key));
    } else {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&["invalid authorization method"]))
                    .unwrap(),
            ))
            .unwrap());
    }

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/account", account::router(state))
        .nest("/servers", servers::router(state))
        .nest("/permissions", permissions::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
