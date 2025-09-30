use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        permissions::{ADMIN_PERMISSIONS, PermissionMap, SERVER_PERMISSIONS, USER_PERMISSIONS},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        user_permissions: &'a PermissionMap,
        admin_permissions: &'a PermissionMap,
        server_permissions: &'a PermissionMap,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route() -> ApiResponseResult {
        ApiResponse::json(Response {
            user_permissions: &USER_PERMISSIONS,
            admin_permissions: &ADMIN_PERMISSIONS,
            server_permissions: &SERVER_PERMISSIONS,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
