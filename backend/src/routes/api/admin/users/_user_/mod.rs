use super::State;
use crate::{
    models::user::User,
    routes::{ApiError, GetState},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
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
        Some(user) => user,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["user not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(ParamUser(user));

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{ApiError, api::admin::users::_user_::GetParamUser};
    use axum::http::StatusCode;
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
    pub async fn route(user: GetParamUser) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    user: user.0.0.into_api_object(true),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::{
        models::{server::Server, user::User},
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let servers = Server::count_by_user_id(&state.database, user.id).await;
        if servers > 0 {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["user has servers, cannot delete"])),
            );
        }

        User::delete_by_id(&state.database, user.id).await;

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

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::routes::{
        ApiError, GetState,
        api::{admin::users::_user_::GetParamUser, client::GetUserActivityLogger},
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
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
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        axum::Json(ApiError::new_value(&["failed to update user password"])),
                    );
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&[
                        "user with email/username already exists",
                    ])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update user: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update user"])),
                );
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

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
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
