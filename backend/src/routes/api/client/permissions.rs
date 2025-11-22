use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        permissions::{
            PermissionMap, get_admin_permissions, get_server_permissions, get_user_permissions,
        },
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
            user_permissions: &get_user_permissions(),
            admin_permissions: &get_admin_permissions(),
            server_permissions: &get_server_permissions(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
