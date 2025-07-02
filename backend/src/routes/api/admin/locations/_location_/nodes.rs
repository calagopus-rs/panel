use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::{Pagination, PaginationParams, location::Location, node::Node},
        routes::{ApiError, GetState},
    };
    use axum::{
        extract::{Path, Query},
        http::StatusCode,
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        nodes: Pagination<crate::models::node::AdminApiNode>,
    }

    #[utoipa::path(get, path = "/", responses(
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
        Query(params): Query<PaginationParams>,
        Path(location): Path<i32>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let location = match Location::by_id(&state.database, location).await {
            Some(location) => location,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["location not found"])),
                );
            }
        };

        let nodes = Node::by_location_id_with_pagination(
            &state.database,
            location.id,
            params.page,
            params.per_page,
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    nodes: Pagination {
                        total: nodes.total,
                        per_page: nodes.per_page,
                        page: nodes.page,
                        data: nodes
                            .data
                            .into_iter()
                            .map(|node| node.into_admin_api_object())
                            .collect(),
                    },
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
