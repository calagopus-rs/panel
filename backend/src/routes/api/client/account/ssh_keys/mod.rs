use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _ssh_key_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, user_ssh_key::UserSshKey},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        ssh_keys: Pagination<crate::models::user_ssh_key::ApiUserSshKey>,
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
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let ssh_keys = UserSshKey::by_user_id_with_pagination(
            &state.database,
            user.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        ApiResponse::json(Response {
            ssh_keys: Pagination {
                total: ssh_keys.total,
                per_page: ssh_keys.per_page,
                page: ssh_keys.page,
                data: ssh_keys
                    .data
                    .into_iter()
                    .map(|ssh_key| ssh_key.into_api_object())
                    .collect(),
            },
        })
        .ok()
    }
}

mod post {
    use crate::{
        models::user_ssh_key::UserSshKey,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 31))]
        #[schema(min_length = 3, max_length = 31)]
        name: String,

        public_key: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        ssh_key: crate::models::user_ssh_key::ApiUserSshKey,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let public_key = match russh::keys::PublicKey::from_openssh(&data.public_key) {
            Ok(key) => key,
            Err(_) => {
                return ApiResponse::error("invalid public key")
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        let ssh_key =
            match UserSshKey::create(&state.database, user.id, &data.name, public_key).await {
                Ok(ssh_key) => ssh_key,
                Err(err) if err.to_string().contains("unique constraint") => {
                    return ApiResponse::error("ssh key with name or fingerprint already exists")
                        .with_status(StatusCode::CONFLICT)
                        .ok();
                }
                Err(err) => {
                    tracing::error!("failed to create ssh key: {:#?}", err);

                    return ApiResponse::error("failed to create ssh key")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            };

        activity_logger
            .log(
                "user:ssh-key.create",
                serde_json::json!({
                    "fingerprint": ssh_key.fingerprint,
                    "name": ssh_key.name,
                }),
            )
            .await;

        ApiResponse::json(Response {
            ssh_key: ssh_key.into_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{ssh_key}", _ssh_key_::router(state))
        .with_state(state.clone())
}
