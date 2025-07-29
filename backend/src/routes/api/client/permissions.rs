use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        models::server_subuser::PERMISSIONS,
        response::{ApiResponse, ApiResponseResult},
    };
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
    pub async fn route() -> ApiResponseResult {
        ApiResponse::json(Response {
            subuser_permissions: &PERMISSIONS,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
