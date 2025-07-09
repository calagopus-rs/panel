use super::State;
use crate::{
    models::nest::Nest,
    routes::{ApiError, GetState},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
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
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["invalid nest id"])).unwrap(),
                ))
                .unwrap());
        }
    };

    let nest = Nest::by_id(&state.database, nest).await;
    let nest = match nest {
        Some(nest) => nest,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["nest not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(nest);

    Ok(next.run(req).await)
}

mod delete {
    use crate::{
        models::nest::Nest,
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        Nest::delete_by_id(&state.database, nest.id).await;

        activity_logger
            .log(
                "admin:nest.delete",
                serde_json::json!({
                    "author": nest.author,
                    "name": nest.name,
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
        api::{admin::nests::_nest_::GetNest, client::GetUserActivityLogger},
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
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
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["nest with name already exists"])),
                );
            }
            Err(err) => {
                tracing::error!("failed to update nest: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&["failed to update nest"])),
                );
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
        .nest("/eggs", eggs::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
