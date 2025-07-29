use super::State;
use crate::{models::nest::Nest, response::ApiResponse, routes::GetState};
use axum::{
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod eggs;

pub type GetNest = crate::extract::ConsumingExtension<Nest>;

pub async fn auth(
    state: GetState,
    Path(nest): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let nest = match nest.first().map(|s| s.parse::<i32>()) {
        Some(Ok(id)) => id,
        _ => {
            return Ok(ApiResponse::error("invalid nest id")
                .with_status(StatusCode::BAD_REQUEST)
                .into_response());
        }
    };

    let nest = Nest::by_id(&state.database, nest).await;
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
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, api::admin::nests::_nest_::GetNest},
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        nest: crate::models::nest::AdminApiNest,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
    ))]
    pub async fn route(nest: GetNest) -> ApiResponseResult {
        ApiResponse::json(Response {
            nest: nest.0.into_admin_api_object(),
        })
        .ok()
    }
}

mod delete {
    use crate::{
        models::nest::Nest,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::{admin::nests::_nest_::GetNest, client::GetUserActivityLogger},
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
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        nest: GetNest,
        activity_logger: GetUserActivityLogger,
    ) -> ApiResponseResult {
        if nest.eggs > 0 {
            return ApiResponse::error("nest has eggs, cannot delete")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        Nest::delete_by_id(&state.database, nest.id).await?;

        activity_logger
            .log(
                "admin:nest.delete",
                serde_json::json!({
                    "author": nest.author,
                    "name": nest.name,
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
            api::{admin::nests::_nest_::GetNest, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        author: Option<String>,
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
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "nest" = i32,
            description = "The nest ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut nest: GetNest,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

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
            WHERE id = $4",
            nest.author,
            nest.name,
            nest.description,
            nest.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) if err.to_string().contains("unique constraint") => {
                return ApiResponse::error("nest with name already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to update nest: {:#?}", err);

                return ApiResponse::error("failed to update nest")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        activity_logger
            .log(
                "admin:nest.update",
                serde_json::json!({
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
