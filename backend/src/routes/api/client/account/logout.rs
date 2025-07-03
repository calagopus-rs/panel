use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::user_session::UserSession,
        routes::{
            ApiError, GetState,
            api::client::{AuthMethod, GetAuthMethod},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
    ))]
    pub async fn route(
        state: GetState,
        auth: GetAuthMethod,
        cookies: Cookies,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let session = match auth.0 {
            AuthMethod::Session(session) => session,
            _ => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&[
                        "unable to log out when not using session authentication",
                    ])),
                );
            }
        };

        UserSession::delete_by_id(&state.database, session.id).await;

        cookies.add(
            Cookie::build(("session", ""))
                .http_only(true)
                .same_site(tower_cookies::cookie::SameSite::Lax)
                .secure(true)
                .path("/")
                .expires(
                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                        + tower_cookies::cookie::time::Duration::seconds(2),
                )
                .build(),
        );

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
