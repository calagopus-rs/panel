use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{
            user::{ApiUser, User},
            user_session::UserSession,
        },
        routes::{ApiError, GetState},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(
            length(min = 3, max = 15),
            regex(path = "*crate::models::user::USERNAME_REGEX")
        )]
        username: String,
        #[validate(email)]
        email: String,
        #[validate(length(min = 2, max = 255))]
        name_first: String,
        #[validate(length(min = 2, max = 255))]
        name_last: String,
        #[validate(length(min = 8, max = 512))]
        password: String,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: ApiUser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        headers: axum::http::HeaderMap,
        cookies: Cookies,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let user = match User::create(
            &state.database,
            &data.username,
            &data.email,
            &data.name_first,
            &data.name_last,
            &data.password,
            false,
        )
        .await
        {
            Ok(user) => user,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&[
                        "this username or email is already taken",
                    ])),
                );
            }
        };

        let key = UserSession::create(
            &state.database,
            user.id,
            ip.0.into(),
            headers
                .get("User-Agent")
                .map(|ua| crate::utils::slice_up_to(ua.to_str().unwrap_or("unknown"), 255))
                .unwrap_or("unknown"),
        )
        .await;

        cookies.add(
            Cookie::build(("session", key))
                .http_only(true)
                .same_site(tower_cookies::cookie::SameSite::Strict)
                .secure(true)
                .path("/")
                .expires(
                    tower_cookies::cookie::time::OffsetDateTime::now_utc()
                        + tower_cookies::cookie::time::Duration::days(30),
                )
                .build(),
        );

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    user: user.into_api_object(true),
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
