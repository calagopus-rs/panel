use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, nest::Nest, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod eggs;

pub type GetNest = shared::extract::ConsumingExtension<Nest>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(nest): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let nest = match nest.first().map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid nest id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("nests.read") {
        return Ok(err.into_response());
    }

    let nest = Nest::by_uuid_optional(&state.database, nest).await;
    let nest = match nest {
        Ok(Some(nest)) => nest,
        Ok(None) => {
            return Ok(ApiResponse::error("nest not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(nest);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::nests::_nest_::GetNest;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        nest: shared::models::nest::AdminApiNest,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(permissions: GetPermissionManager, nest: GetNest) -> ApiResponseResult {
        permissions.has_admin_permission("nests.read")?;

        ApiResponse::json(Response {
            nest: nest.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::nests::_nest_::GetNest;
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel, admin_activity::GetAdminActivityLogger, nest_egg::NestEgg,
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
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        nest: GetNest,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("nests.delete")?;

        if NestEgg::count_by_nest_uuid(&state.database, nest.uuid).await > 0 {
            return ApiResponse::error("nest has eggs, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        nest.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "nest:delete",
                serde_json::json!({
                    "uuid": nest.uuid,
                    "author": nest.author,
                    "name": nest.name,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::nests::_nest_::GetNest;
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
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        author: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<compact_str::CompactString>,

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,
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
            "nest" = uuid::Uuid,
            description = "The nest ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut nest: GetNest,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("nests.update")?;

        if let Some(name) = data.name {
            nest.name = name;
        }
        if let Some(author) = data.author {
            nest.author = author;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                nest.description = None;
            } else {
                nest.description = Some(description);
            }
        }

        match sqlx::query!(
            "UPDATE nests
            SET author = $1, name = $2, description = $3
            WHERE nests.uuid = $4",
            &nest.author,
            &nest.name,
            nest.description.as_deref(),
            nest.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("nest with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update nest: {:?}", err);

                return ApiResponse::error("failed to update nest")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "nest:update",
                serde_json::json!({
                    "uuid": nest.uuid,
                    "author": nest.author,
                    "name": nest.name,
                    "description": nest.description,
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
        .nest("/eggs", eggs::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
