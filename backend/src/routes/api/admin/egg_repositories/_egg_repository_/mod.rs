use super::State;
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use shared::{
    GetState,
    models::{ByUuid, egg_repository::EggRepository, user::GetPermissionManager},
    response::ApiResponse,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod eggs;
mod sync;

pub type GetEggRepository = shared::extract::ConsumingExtension<EggRepository>;

pub async fn auth(
    state: GetState,
    permissions: GetPermissionManager,
    Path(egg_repository): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let egg_repository = match egg_repository.first().map(|s| s.parse::<uuid::Uuid>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid egg repository id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    if let Err(err) = permissions.has_admin_permission("egg-repositories.read") {
        return Ok(err.into_response());
    }

    let egg_repository = EggRepository::by_uuid_optional(&state.database, egg_repository).await;
    let egg_repository = match egg_repository {
        Ok(Some(egg_repository)) => egg_repository,
        Ok(None) => {
            return Ok(ApiResponse::error("egg repository not found")
                .with_status(StatusCode::NOT_FOUND)
                .into_response());
        }
        Err(err) => return Ok(ApiResponse::from(err).into_response()),
    };

    req.extensions_mut().insert(egg_repository);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::api::admin::egg_repositories::_egg_repository_::GetEggRepository;
    use serde::Serialize;
    use shared::{
        ApiError,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        egg_repository: shared::models::egg_repository::AdminApiEggRepository,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "egg_repository" = uuid::Uuid,
            description = "The egg repository ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        permissions: GetPermissionManager,
        egg_repository: GetEggRepository,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("egg-repositories.read")?;

        ApiResponse::json(Response {
            egg_repository: egg_repository.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::routes::api::admin::egg_repositories::_egg_repository_::GetEggRepository;
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
            "egg_repository" = uuid::Uuid,
            description = "The egg repository ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        egg_repository: GetEggRepository,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("egg-repositories.delete")?;

        egg_repository.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "egg-repository:delete",
                serde_json::json!({
                    "uuid": egg_repository.uuid,
                    "name": egg_repository.name,
                    "git_repository": egg_repository.git_repository,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::routes::api::admin::egg_repositories::_egg_repository_::GetEggRepository;
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

        #[validate(url)]
        #[schema(example = "https://github.com/example/repo.git", format = "uri")]
        git_repository: Option<compact_str::CompactString>,
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
            "egg_repository" = uuid::Uuid,
            description = "The egg repository ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        mut egg_repository: GetEggRepository,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("egg-repositories.update")?;

        if let Some(name) = data.name {
            egg_repository.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                egg_repository.description = None;
            } else {
                egg_repository.description = Some(description);
            }
        }
        if let Some(git_repository) = data.git_repository {
            egg_repository.git_repository = git_repository;
        }

        match sqlx::query!(
            "UPDATE egg_repositories
            SET name = $1, description = $2, git_repository = $3
            WHERE egg_repositories.uuid = $4",
            &egg_repository.name,
            egg_repository.description.as_deref(),
            &egg_repository.git_repository,
            egg_repository.uuid,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error(
                    "egg repository with name/git repository already exists",
                )
                .with_status(StatusCode::CONFLICT)
                .ok();
            }
            Err(err) => {
                tracing::error!("failed to update egg repository: {:?}", err);

                return ApiResponse::error("failed to update egg repository")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "egg_repository:update",
                serde_json::json!({
                    "uuid": egg_repository.uuid,
                    "name": egg_repository.name,
                    "description": egg_repository.description,
                    "git_repository": egg_repository.git_repository,
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
        .nest("/sync", sync::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
