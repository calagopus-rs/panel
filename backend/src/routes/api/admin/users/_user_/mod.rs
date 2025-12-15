use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{
        ByUuid,
        user::{GetPermissionManager, User},
    },
    response::ApiResponse,
};
use std::ops::{Deref, DerefMut};
use utoipa_axum::{router::OpenApiRouter, routes};

mod activity;
mod oauth_links;
mod servers;
mod two_factor;

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

pub type GetParamUser = shared::extract::ConsumingExtension<ParamUser>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(user): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_admin_permission("users.read") {
        return Ok(err.into_response());
    }

    let user = match uuid::Uuid::parse_str(&user[0]) {
        Ok(user) => user,
        Err(_) => {
            return Ok(ApiResponse::error("invalid user uuid")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };
    let user = User::by_uuid_optional(&state.database, user).await;
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
    use crate::routes::api::admin::users::_user_::GetParamUser;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        user: shared::models::user::ApiFullUser,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = uuid::Uuid,
            description = "The user ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetParamUser,
    ) -> ApiResponseResult {
        permissions.has_user_permission("users.read")?;

        ApiResponse::json(Response {
            user: user
                .0
                .0
                .into_api_full_object(&state.storage.retrieve_urls().await),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::users::_user_::GetParamUser;
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, server::Server,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "user" = uuid::Uuid,
            description = "The user ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetParamUser,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("users.delete")?;

        let servers = Server::count_by_user_uuid(&state.database, user.uuid).await;
        if servers > 0 {
            return ApiResponse::error("user has servers, cannot delete")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        state.storage.remove(user.avatar.as_deref()).await?;
        user.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "user:delete",
                serde_json::json!({
                    "uuid": user.uuid,
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
    use crate::routes::api::admin::users::_user_::GetParamUser;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger, role::Role, user::GetPermissionManager,
        },
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        role_uuid: Option<uuid::Uuid>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<compact_str::CompactString>,

        #[validate(
            length(min = 3, max = 15),
            regex(path = "*shared::models::user::USERNAME_REGEX")
        )]
        #[schema(min_length = 3, max_length = 15)]
        #[schema(pattern = "^[a-zA-Z0-9_]+$")]
        username: Option<compact_str::CompactString>,
        #[validate(email)]
        #[schema(format = "email")]
        email: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_first: Option<compact_str::CompactString>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        name_last: Option<compact_str::CompactString>,
        #[validate(length(min = 8, max = 512))]
        #[schema(min_length = 8, max_length = 512)]
        password: Option<compact_str::CompactString>,

        admin: Option<bool>,

        #[validate(
            length(min = 5, max = 15),
            custom(function = "shared::validate_language")
        )]
        #[schema(min_length = 5, max_length = 15)]
        language: Option<compact_str::CompactString>,
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
            "user" = uuid::Uuid,
            description = "The user ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut user: GetParamUser,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("users.update")?;

        if let Some(role_uuid) = data.role_uuid {
            if role_uuid.is_nil() {
                user.role = None;
            } else {
                let role = match Role::by_uuid_optional(&state.database, role_uuid).await? {
                    Some(role) => role,
                    None => {
                        return ApiResponse::error("role not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }
                };

                user.role = Some(role);
            }
        }
        if let Some(external_id) = data.external_id {
            if external_id.is_empty() {
                user.external_id = None;
            } else {
                user.external_id = Some(external_id);
            }
        }
        if let Some(username) = data.username {
            user.username = username;
        }
        if let Some(email) = data.email {
            user.email = email.into();
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
                    tracing::error!("failed to update user password: {:?}", err);

                    return ApiResponse::error("failed to update user password")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            }
        }
        if let Some(admin) = data.admin {
            user.admin = admin;
        }
        if let Some(language) = data.language {
            user.language = language;
        }

        match sqlx::query!(
            "UPDATE users
            SET role_uuid = $2, external_id = $3, username = $4, email = $5, name_first = $6, name_last = $7, admin = $8, language = $9
            WHERE users.uuid = $1",
            user.uuid,
            user.role.as_ref().map(|role| role.uuid),
            user.external_id.as_deref(),
            &user.username,
            &user.email,
            &user.name_first,
            &user.name_last,
            user.admin,
            &user.language,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("user with email/username/external_id already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update user: {:?}", err);

                return ApiResponse::error("failed to update user")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "user:update",
                serde_json::json!({
                    "uuid": user.uuid,
                    "role_uuid": user.role.as_ref().map(|r| r.uuid),
                    "username": user.username,
                    "email": user.email,
                    "name_first": user.name_first,
                    "name_last": user.name_last,
                    "admin": user.admin,
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
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/two-factor", two_factor::router(state))
        .nest("/servers", servers::router(state))
        .nest("/activity", activity::router(state))
        .nest("/oauth-links", oauth_links::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
