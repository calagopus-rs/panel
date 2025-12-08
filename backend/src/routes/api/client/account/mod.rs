use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod activity;
mod api_keys;
mod avatar;
mod email;
mod logout;
mod oauth_links;
mod password;
mod security_keys;
mod sessions;
mod ssh_keys;
mod two_factor;

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetUser,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: shared::models::user::ApiFullUser,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, user: GetUser) -> ApiResponseResult {
        ApiResponse::json(Response {
            user: user
                .0
                .into_api_full_object(&state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

mod patch {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{user::GetUser, user_activity::GetUserActivityLogger},
        response::{ApiResponse, ApiResponseResult},
    };
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
        username: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_first: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_last: Option<String>,

        #[validate(
            length(min = 5, max = 15),
            custom(function = "shared::validate_language")
        )]
        #[schema(min_length = 5, max_length = 15)]
        language: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(username) = data.username {
            user.username = username;
        }
        if let Some(name_first) = data.name_first {
            user.name_first = name_first;
        }
        if let Some(name_last) = data.name_last {
            user.name_last = name_last;
        }
        if let Some(language) = data.language {
            user.language = language;
        }

        sqlx::query!(
            "UPDATE users
            SET username = $2, name_first = $3, name_last = $4, language = $5
            WHERE users.uuid = $1",
            user.uuid,
            user.username,
            user.name_first,
            user.name_last,
            user.language,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "user:account.update",
                serde_json::json!({
                    "username": user.username,
                    "name_first": user.name_first,
                    "name_last": user.name_last,
                    "language": user.language,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(patch::route))
        .nest("/logout", logout::router(state))
        .nest("/avatar", avatar::router(state))
        .nest("/email", email::router(state))
        .nest("/password", password::router(state))
        .nest("/two-factor", two_factor::router(state))
        .nest("/security-keys", security_keys::router(state))
        .nest("/oauth-links", oauth_links::router(state))
        .nest("/api-keys", api_keys::router(state))
        .nest("/ssh-keys", ssh_keys::router(state))
        .nest("/sessions", sessions::router(state))
        .nest("/activity", activity::router(state))
        .with_state(state.clone())
}
