use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::mount::Mount,
        routes::{ApiError, GetState},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        mount: crate::models::mount::AdminApiMount,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        Path(mount): Path<i32>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mount = match Mount::by_id(&state.database, mount).await {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    mount: mount.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::{
        models::mount::Mount,
        routes::{ApiError, GetState, api::client::GetUserActivityLogger},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "mount" = i32,
            description = "The mount ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        Path(mount): Path<i32>,
        activity_logger: GetUserActivityLogger,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mount = match Mount::by_id(&state.database, mount).await {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        if mount.eggs > 0 {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["mount has eggs, cannot delete"])),
            );
        }
        if mount.nodes > 0 {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["mount has nodes, cannot delete"])),
            );
        }
        if mount.servers > 0 {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["mount has servers, cannot delete"])),
            );
        }

        Mount::delete_by_id(&state.database, mount.id).await;

        activity_logger
            .log(
                "admin:mount.delete",
                serde_json::json!({
                    "id": mount.id,
                    "name": mount.name,
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
    use crate::{
        models::mount::Mount,
        routes::{ApiError, GetState, api::client::GetUserActivityLogger},
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        source: Option<String>,
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        target: Option<String>,

        read_only: Option<bool>,
        user_mountable: Option<bool>,
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
        Path(mount): Path<i32>,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mut mount = match Mount::by_id(&state.database, mount).await {
            Some(mount) => mount,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["mount not found"])),
                );
            }
        };

        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Some(name) = data.name {
            mount.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                mount.description = None;
            } else {
                mount.description = Some(description);
            }
        }
        if let Some(source) = data.source {
            mount.source = source;
        }
        if let Some(target) = data.target {
            mount.target = target;
        }
        if let Some(read_only) = data.read_only {
            mount.read_only = read_only;
        }
        if let Some(user_mountable) = data.user_mountable {
            mount.user_mountable = user_mountable;
        }

        match sqlx::query!(
            "UPDATE mounts
            SET name = $1, description = $2, source = $3, target = $4, read_only = $5, user_mountable = $6
            WHERE id = $7",
            mount.name,
            mount.description,
            mount.source,
            mount.target,
            mount.read_only,
            mount.user_mountable,
            mount.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["mount with name/source/target already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update mount: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update mount"])),
                );
            }
        }

        activity_logger
            .log(
                "admin:mount.update",
                serde_json::json!({
                    "id": mount.id,
                    "name": mount.name,
                    "description": mount.description,

                    "source": mount.source,
                    "target": mount.target,

                    "read_only": mount.read_only,
                    "user_mountable": mount.user_mountable,
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
        .with_state(state.clone())
}
