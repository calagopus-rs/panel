use super::{ApiError, GetState, State};
use crate::models::user::User;
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};
use tower_cookies::{Cookie, Cookies};
use utoipa_axum::router::OpenApiRouter;

mod account;

pub type GetUser = axum::extract::Extension<User>;

async fn auth(
    state: GetState,
    cookies: Cookies,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let session_id = cookies
        .get("session")
        .map(|c| c.value().to_string())
        .unwrap_or_default();

    if session_id.len() != 64 {
        return Ok(Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::to_string(&ApiError::new_value(&["invalid authorization cookie"]))
                    .unwrap(),
            ))
            .unwrap());
    }

    let user = /*state
        .cache
        .cached(&format!("user::session::{session_id}"), 300, || {
            User::by_session(&state.database, &session_id)
        })
        .await;*/
    User::by_session(&state.database, &session_id).await;
    let (user, mut session) = match user {
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

    session.ip = crate::utils::extract_ip(req.headers()).unwrap().into();
    session.user_agent = req
        .headers()
        .get("User-Agent")
        .map(|ua| crate::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
        .unwrap_or("unknown")
        .to_string();
    session.save(&state.database).await;

    cookies.add(
        Cookie::build(("session", session_id))
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

    Ok(next.run(req).await)
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/account", account::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
