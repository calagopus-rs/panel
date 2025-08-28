use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _security_key_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, user_security_key::UserSecurityKey},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        security_keys: Pagination<crate::models::user_security_key::ApiUserSecurityKey>,
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
        (
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let security_keys = UserSecurityKey::by_user_uuid_with_pagination(
            &state.database,
            user.uuid,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            security_keys: Pagination {
                total: security_keys.total,
                per_page: security_keys.per_page,
                page: security_keys.page,
                data: security_keys
                    .data
                    .into_iter()
                    .map(|security_key| security_key.into_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::user_security_key::UserSecurityKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;
    use webauthn_rs::prelude::CreationChallengeResponse;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        name: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        security_key: crate::models::user_security_key::ApiUserSecurityKey,
        #[schema(value_type = serde_json::Value)]
        options: CreationChallengeResponse,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let webauthn = state.settings.get_webauthn().await?;

        let credential_ids = sqlx::query!(
            "SELECT user_security_keys.credential_id
            FROM user_security_keys
            WHERE user_security_keys.user_uuid = $1 AND user_security_keys.passkey IS NOT NULL",
            user.uuid
        )
        .fetch_all(state.database.read())
        .await?;

        let (options, registration) = webauthn.start_passkey_registration(
            user.uuid,
            &user.email,
            &user.username,
            Some(
                credential_ids
                    .into_iter()
                    .map(|id| id.credential_id.into())
                    .collect(),
            ),
        )?;

        let security_key =
            match UserSecurityKey::create(&state.database, user.uuid, &data.name, registration)
                .await
            {
                Ok(security_key) => security_key,
                Err(err) if err.to_string().contains("unique constraint") => {
                    return ApiResponse::error("security key with name already exists")
                        .with_status(StatusCode::CONFLICT)
                        .ok();
                }
                Err(err) => {
                    tracing::error!("failed to create security key: {:#?}", err);

                    return ApiResponse::error("failed to create security key")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };

        ApiResponse::json(Response {
            security_key: security_key.into_api_object(),
            options,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{security_key}", _security_key_::router(state))
        .with_state(state.clone())
}
