use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _apikey_;

mod get {
    use crate::{
        models::{Pagination, user_api_key::UserApiKey},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Params {
        #[validate(range(min = 1))]
        #[serde(default = "Pagination::default_page")]
        page: i64,
        #[validate(range(min = 1, max = 100))]
        #[serde(default = "Pagination::default_per_page")]
        per_page: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        api_keys: Pagination<crate::models::user_api_key::ApiUserApiKey>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let api_keys = UserApiKey::by_user_id_with_pagination(
            &state.database,
            user.id,
            params.page,
            params.per_page,
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    api_keys: Pagination {
                        total: api_keys.total,
                        per_page: api_keys.per_page,
                        page: api_keys.page,
                        data: api_keys
                            .data
                            .into_iter()
                            .map(|api_key| api_key.into_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

mod post {
    use crate::{
        models::user_api_key::UserApiKey,
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        name: String,

        permissions: Vec<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        api_key: crate::models::user_api_key::ApiUserApiKey,
        key: String,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let (key, api_key) = match UserApiKey::create(
            &state.database,
            user.id,
            &data.name,
            data.permissions,
        )
        .await
        {
            Ok(api_key) => api_key,
            Err(_) => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&[
                        "api key with name already exists"
                    ])),
                );
            }
        };

        user.log_activity(
            &state.database,
            "user:api-key.create",
            ip,
            serde_json::json!({
                "identifier": api_key.key_start,
                "name": api_key.name,
                "permissions": api_key.permissions,
            }),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    api_key: api_key.into_api_object(),
                    key,
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{apikey}", _apikey_::router(state))
        .with_state(state.clone())
}
