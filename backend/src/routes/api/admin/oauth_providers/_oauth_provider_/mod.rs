use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, oauth_provider::OAuthProvider, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod users;

pub type GetOAuthProvider = shared::extract::ConsumingExtension<OAuthProvider>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(database_host): Path<uuid::Uuid>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Err(err) = permissions.has_admin_permission("oauth-providers.read") {
        return Ok(err.into_response());
    }

    let database_host = OAuthProvider::by_uuid_optional(&state.database, database_host).await;
    let database_host = match database_host {
        Ok(Some(database_host)) => database_host,
        Ok(None) => {
            return Ok(ApiResponse::error("oauth provider not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(database_host);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::oauth_providers::_oauth_provider_::GetOAuthProvider;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        oauth_provider: shared::models::oauth_provider::AdminApiOAuthProvider,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "oauth_provider" = uuid::Uuid,
            description = "The oauth provider ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        oauth_provider: GetOAuthProvider,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("oauth-providers.read")?;

        ApiResponse::json(Response {
            oauth_provider: oauth_provider
                .0
                .into_admin_api_object(&state.database)
                .await?,
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::oauth_providers::_oauth_provider_::GetOAuthProvider;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "oauth_provider" = uuid::Uuid,
            description = "The oauth provider ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        oauth_provider: GetOAuthProvider,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("oauth-providers.delete")?;

        oauth_provider.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "oauth-provider:delete",
                serde_json::json!({
                    "uuid": oauth_provider.uuid,
                    "name": oauth_provider.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::oauth_providers::_oauth_provider_::GetOAuthProvider;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        prelude::SqlxErrorExtension,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,
        enabled: Option<bool>,
        login_only: Option<bool>,
        link_viewable: Option<bool>,
        user_manageable: Option<bool>,
        basic_auth: Option<bool>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        client_id: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        client_secret: Option<compact_str::CompactString>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        auth_url: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        token_url: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        info_url: Option<String>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        scopes: Option<Vec<compact_str::CompactString>>,

        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        identifier_path: Option<String>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        email_path: Option<String>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        username_path: Option<String>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        name_first_path: Option<String>,
        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        name_last_path: Option<String>,
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
            "oauth_provider" = uuid::Uuid,
            description = "The oauth provider ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut oauth_provider: GetOAuthProvider,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("oauth-providers.update")?;

        if let Some(name) = data.name {
            oauth_provider.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                oauth_provider.description = None;
            } else {
                oauth_provider.description = Some(description);
            }
        }
        if let Some(enabled) = data.enabled {
            oauth_provider.enabled = enabled;
        }
        if let Some(login_only) = data.login_only {
            oauth_provider.login_only = login_only;
        }
        if let Some(link_viewable) = data.link_viewable {
            oauth_provider.link_viewable = link_viewable;
        }
        if let Some(user_manageable) = data.user_manageable {
            oauth_provider.user_manageable = user_manageable;
        }
        if let Some(basic_auth) = data.basic_auth {
            oauth_provider.basic_auth = basic_auth;
        }
        if let Some(client_id) = data.client_id {
            oauth_provider.client_id = client_id;
        }
        if let Some(client_secret) = data.client_secret {
            oauth_provider.client_secret = state.database.encrypt(client_secret).await?;
        }
        if let Some(auth_url) = data.auth_url {
            oauth_provider.auth_url = auth_url;
        }
        if let Some(token_url) = data.token_url {
            oauth_provider.token_url = token_url;
        }
        if let Some(info_url) = data.info_url {
            oauth_provider.info_url = info_url;
        }
        if let Some(scopes) = data.scopes {
            oauth_provider.scopes = scopes;
        }
        if let Some(identifier_path) = data.identifier_path {
            oauth_provider.identifier_path = identifier_path;
        }
        if let Some(email_path) = data.email_path {
            if email_path.is_empty() {
                oauth_provider.email_path = None;
            } else {
                oauth_provider.email_path = Some(email_path);
            }
        }
        if let Some(username_path) = data.username_path {
            if username_path.is_empty() {
                oauth_provider.username_path = None;
            } else {
                oauth_provider.username_path = Some(username_path);
            }
        }
        if let Some(name_first_path) = data.name_first_path {
            if name_first_path.is_empty() {
                oauth_provider.name_first_path = None;
            } else {
                oauth_provider.name_first_path = Some(name_first_path);
            }
        }
        if let Some(name_last_path) = data.name_last_path {
            if name_last_path.is_empty() {
                oauth_provider.name_last_path = None;
            } else {
                oauth_provider.name_last_path = Some(name_last_path);
            }
        }

        match sqlx::query!(
            "UPDATE oauth_providers
            SET name = $2, description = $3, client_id = $4, client_secret = $5, auth_url = $6,
                token_url = $7, scopes = $8, identifier_path = $9, email_path = $10, username_path = $11,
                name_first_path = $12, name_last_path = $13, enabled = $14, login_only = $15,
                link_viewable = $16, user_manageable = $17
            WHERE oauth_providers.uuid = $1",
            oauth_provider.uuid,
            &oauth_provider.name,
            oauth_provider.description.as_deref(),
            &oauth_provider.client_id,
            oauth_provider.client_secret,
            oauth_provider.auth_url,
            oauth_provider.token_url,
            &oauth_provider.scopes as &[compact_str::CompactString],
            oauth_provider.identifier_path,
            oauth_provider.email_path,
            oauth_provider.username_path,
            oauth_provider.name_first_path,
            oauth_provider.name_last_path,
            oauth_provider.enabled,
            oauth_provider.login_only,
            oauth_provider.link_viewable,
            oauth_provider.user_manageable
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("oauth provider with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update oauth provider: {:?}", err);

                return ApiResponse::error("failed to update oauth provider")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "oauth-provider:update",
                serde_json::json!({
                    "name": oauth_provider.name,
                    "description": oauth_provider.description,
                    "enabled": oauth_provider.enabled,
                    "login_only": oauth_provider.login_only,
                    "link_viewable": oauth_provider.link_viewable,
                    "user_manageable": oauth_provider.user_manageable,
                    "basic_auth": oauth_provider.basic_auth,

                    "client_id": oauth_provider.client_id,
                    "client_secret": oauth_provider.client_secret,

                    "auth_url": oauth_provider.auth_url,
                    "token_url": oauth_provider.token_url,
                    "info_url": oauth_provider.info_url,
                    "scopes": oauth_provider.scopes,

                    "identifier_path": oauth_provider.identifier_path,
                    "email_path": oauth_provider.email_path,
                    "username_path": oauth_provider.username_path,
                    "name_first_path": oauth_provider.name_first_path,
                    "name_last_path": oauth_provider.name_last_path,
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
        .nest("/users", users::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
