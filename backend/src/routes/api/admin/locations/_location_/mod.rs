use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod nodes;

mod delete {
    use crate::{
        models::location::Location,
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = inline(ApiError)),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(location): Path<i32>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let location = match Location::by_id(&state.database, location).await {
            Some(location) => location,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["location not found"])),
                );
            }
        };

        Location::delete_by_id(&state.database, location.id).await;

        user.log_activity(
            &state.database,
            "admin:location.delete",
            ip,
            auth,
            serde_json::json!({
                "short_name": location.short_name,
                "name": location.name,
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
        models::location::Location,
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 31))]
        #[schema(min_length = 2, max_length = 31)]
        short_name: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,

        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = inline(ApiError)),
        (status = BAD_REQUEST, body = inline(ApiError)),
        (status = CONFLICT, body = inline(ApiError)),
    ), params(
        (
            "location" = i32,
            description = "The location ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        Path(location): Path<i32>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let mut location = match Location::by_id(&state.database, location).await {
            Some(location) => location,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["location not found"])),
                );
            }
        };

        if let Some(name) = data.name {
            location.name = name;
        }
        if let Some(short_name) = data.short_name {
            location.short_name = short_name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                location.description = None;
            } else {
                location.description = Some(description);
            }
        }

        if sqlx::query!(
            "UPDATE locations
            SET short_name = $1, name = $2, description = $3
            WHERE id = $4",
            location.short_name,
            location.name,
            location.description,
            location.id,
        )
        .execute(state.database.write())
        .await
        .is_err()
        {
            return (
                StatusCode::CONFLICT,
                axum::Json(ApiError::new_value(&["location with name already exists"])),
            );
        }

        user.log_activity(
            &state.database,
            "admin:location.update",
            ip,
            auth,
            serde_json::json!({
                "short_name": location.short_name,
                "name": location.name,
                "description": location.description,
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
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/nodes", nodes::router(state))
        .with_state(state.clone())
}
