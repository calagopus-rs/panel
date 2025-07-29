use super::State;
use crate::{models::user::User, response::ApiResponse, routes::GetState};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::ops::{Deref, DerefMut};
use utoipa_axum::{router::OpenApiRouter, routes};

mod servers;

#[derive(Clone)]
pub struct ParamUser(pub User);

impl Deref for ParamUser {
    type Target = User;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for ParamUser {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

pub type GetParamUser = crate::extract::ConsumingExtension<ParamUser>;

pub async fn auth(
    state: GetState,
    Path(user): Path<i32>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let user = User::by_id(&state.database, user).await;
    let user = match user {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Ok(ApiResponse::error("user not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(ParamUser(user));

    Ok(next.run(req).await)
}

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, api::admin::users::_user_::GetParamUser},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: crate::models::user::ApiUser,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = i32,
            description = "The user ID",
            example = "1",
        ),
    ))]
    pub async fn route(user: GetParamUser) -> ApiResponseResult {
        ApiResponse::json(Response {
            user: user.0.0.into_api_object(true),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::{server::Server, user::User},
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::users::_user_::GetParamUser, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = i32,
            description = "The user ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetParamUser,
        activity_logger: GetUserActivityLogger,
    ) -> ApiResponseResult {
        let servers = Server::count_by_user_id(&state.database, user.id).await;
        if servers > 0 {
            return ApiResponse::error("user has servers, cannot delete")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        User::delete_by_id(&state.database, user.id).await?;

        activity_logger
            .log(
                "admin:user.delete",
                serde_json::json!({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "name_first": user.name_first,
                    "name_last": user.name_last,
                    "admin": user.admin,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::users::_user_::GetParamUser, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(
            length(min = 3, max = 15),
            regex(path = "*crate::models::user::USERNAME_REGEX")
        )]
        #[schema(min_length = 3, max_length = 15)]
        #[schema(pattern = "^[a-zA-Z0-9_]+$")]
        username: Option<String>,
        #[validate(email)]
        #[schema(format = "email")]
        email: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_first: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_last: Option<String>,
        #[validate(length(min = 8, max = 512))]
        #[schema(min_length = 8, max_length = 512)]
        password: Option<String>,

        admin: Option<bool>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut user: GetParamUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(username) = data.username {
            user.username = username;
        }
        if let Some(email) = data.email {
            user.email = email;
        }
        if let Some(name_first) = data.name_first {
            user.name_first = name_first;
        }
        if let Some(name_last) = data.name_last {
            user.name_last = name_last;
        }
        if let Some(password) = data.password {
            match user.update_password(&state.database, &password).await {
                Ok(_) => {}
                Err(err) => {
                    tracing::error!("failed to update user password: {:#?}", err);

                    return ApiResponse::error("failed to update user password")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            }
        }
        if let Some(admin) = data.admin {
            user.admin = admin;
        }

        match sqlx::query!(
            "UPDATE users
            SET username = $1, email = $2, name_first = $3, name_last = $4, admin = $5
            WHERE id = $6",
            user.username,
            user.email,
            user.name_first,
            user.name_last,
            user.admin,
            user.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("user with email/username already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update user: {:#?}", err);

                return ApiResponse::error("failed to update user")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "admin:user.update",
                serde_json::json!({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "name_first": user.name_first,
                    "name_last": user.name_last,
                    "admin": user.admin,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/servers", servers::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
