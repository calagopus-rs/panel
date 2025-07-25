use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _session_;

mod get {
    use crate::{
        models::{Pagination, PaginationParamsWithSearch, user_session::UserSession},
        routes::{
            ApiError, GetState,
            api::client::{GetAuthMethod, GetUser},
        },
    };
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        sessions: Pagination<crate::models::user_session::ApiUserSession>,
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
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        auth: GetAuthMethod,
        user: GetUser,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&params) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        let sessions = UserSession::by_user_id_with_pagination(
            &state.database,
            user.id,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    sessions: Pagination {
                        total: sessions.total,
                        per_page: sessions.per_page,
                        page: sessions.page,
                        data: sessions
                            .data
                            .into_iter()
                            .map(|session| session.into_api_object(&auth))
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
        .nest("/{session}", _session_::router(state))
        .with_state(state.clone())
}
