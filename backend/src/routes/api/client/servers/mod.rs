use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _server_;

mod get {
    use crate::{
        models::{Pagination, server::Server},
        routes::{ApiError, GetState, api::client::GetUser},
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Params {
        #[validate(range(min = 1))]
        #[serde(default = "Pagination::default_page")]
        pub page: i64,
        #[validate(range(min = 1, max = 100))]
        #[serde(default = "Pagination::default_per_page")]
        pub per_page: i64,

        #[serde(default)]
        other: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<crate::models::server::ApiServer>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
        (
            "other" = bool, Query,
            description = "If true, returns servers not owned by the user (admin only)",
            example = "false",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        Query(params): Query<Params>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let servers = if params.other && user.admin {
            Server::by_not_user_id_with_pagination(
                &state.database,
                user.id,
                params.page,
                params.per_page,
            )
            .await
        } else {
            Server::by_user_id_with_pagination(
                &state.database,
                user.id,
                params.page,
                params.per_page,
            )
            .await
        };

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    servers: Pagination {
                        total: servers.total,
                        per_page: servers.per_page,
                        page: servers.page,
                        data: servers
                            .data
                            .into_iter()
                            .map(|server| server.into_api_object(&user))
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
        .nest("/{server}", _server_::router(state))
        .with_state(state.clone())
}
