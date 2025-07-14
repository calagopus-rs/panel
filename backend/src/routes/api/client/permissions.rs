use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::models::server_subuser::PERMISSIONS;
    use axum::http::StatusCode;
    use indexmap::IndexMap;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        subuser_permissions:
            &'a IndexMap<&'static str, (&'static str, IndexMap<&'static str, &'static str>)>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route() -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    subuser_permissions: &PERMISSIONS,
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
