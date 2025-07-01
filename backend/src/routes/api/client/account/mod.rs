use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod activity;
mod api_keys;
mod email;
mod password;
mod ssh_keys;
mod two_factor;

mod get {
    use crate::{models::user::ApiUser, routes::api::client::GetUser};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: ApiUser,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(user: GetUser) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    user: user.0.into_api_object(true),
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/email", email::router(state))
        .nest("/password", password::router(state))
        .nest("/two-factor", two_factor::router(state))
        .nest("/activity", activity::router(state))
        .nest("/api-keys", api_keys::router(state))
        .nest("/ssh-keys", ssh_keys::router(state))
        .with_state(state.clone())
}
