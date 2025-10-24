use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{ByUuid, user::User, user_session::UserSession},
        response::{ApiResponse, ApiResponseResult},
    };
    use tower_cookies::{Cookie, Cookies};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(
            length(min = 3, max = 15),
            regex(path = "*shared::models::user::USERNAME_REGEX")
        )]
        #[schema(min_length = 3, max_length = 15)]
        #[schema(pattern = "^[a-zA-Z0-9_]+$")]
        username: String,
        #[validate(email)]
        #[schema(format = "email")]
        email: String,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_first: String,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_last: String,
        #[validate(length(min = 8, max = 512))]
        #[schema(min_length = 8, max_length = 512)]
        password: String,

        captcha: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: shared::models::user::ApiFullUser,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: shared::GetIp,
        headers: axum::http::HeaderMap,
        cookies: Cookies,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let settings = state.settings.get().await;
        if !settings.app.registration_enabled {
            return ApiResponse::error("registration is disabled")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let secure = settings.app.url.starts_with("https://");

        drop(settings);

        if let Err(error) = state.captcha.verify(ip, data.captcha).await {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let user = match User::create(
            &state.database,
            None,
            &data.username,
            &data.email,
            &data.name_first,
            &data.name_last,
            &data.password,
            false,
        )
        .await
        {
            Ok(user_uuid) => User::by_uuid(&state.database, user_uuid).await?,
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("user with username or email already exists")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create user: {:#?}", err);

                return ApiResponse::error("failed to create user")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

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

        ApiResponse::json(Response {
            user: user.into_api_full_object(&state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
