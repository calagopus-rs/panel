use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod activity;
mod api_keys;
mod email;
mod logout;
mod password;
mod security_keys;
mod sessions;
mod ssh_keys;
mod two_factor;

mod get {
    use crate::{
        models::user::ApiUser,
        response::{ApiResponse, ApiResponseResult},
        routes::api::client::GetUser,
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: ApiUser,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(user: GetUser) -> ApiResponseResult {
        ApiResponse::json(Response {
            user: user.0.into_api_object(true),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/logout", logout::router(state))
        .nest("/email", email::router(state))
        .nest("/password", password::router(state))
        .nest("/two-factor", two_factor::router(state))
        .nest("/security-keys", security_keys::router(state))
        .nest("/api-keys", api_keys::router(state))
        .nest("/ssh-keys", ssh_keys::router(state))
        .nest("/sessions", sessions::router(state))
        .nest("/activity", activity::router(state))
        .with_state(state.clone())
}
