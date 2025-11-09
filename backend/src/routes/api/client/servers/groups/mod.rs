use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _server_group_;
mod order;

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::{
            user::{GetPermissionManager, GetUser},
            user_server_group::UserServerGroup,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        server_groups: Vec<shared::models::user_server_group::ApiUserServerGroup>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
    ) -> ApiResponseResult {
        permissions.has_user_permission("servers.read")?;

        let server_groups = UserServerGroup::all_by_user_uuid(&state.database, user.uuid).await?;

        ApiResponse::json(Response {
            server_groups: server_groups
                .into_iter()
                .map(|server_group| server_group.into_api_object())
                .collect(),
        })
        .ok()
    }
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_server_group::UserServerGroup,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 2, max = 31))]
        #[schema(min_length = 2, max_length = 31)]
        name: String,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        server_order: Vec<uuid::Uuid>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        server_group: shared::models::user_server_group::ApiUserServerGroup,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_user_permission("servers.create")?;

        let server_groups = UserServerGroup::count_by_user_uuid(&state.database, user.uuid).await;
        if server_groups >= 25 {
            return ApiResponse::error("maximum number of server groups reached")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let server_group =
            UserServerGroup::create(&state.database, user.uuid, &data.name, &data.server_order)
                .await?;

        activity_logger
            .log(
                "user:server-group.create",
                serde_json::json!({
                    "uuid": server_group.uuid,
                    "name": server_group.name,
                    "server_order": server_group.server_order,
                }),
            )
            .await;

        ApiResponse::json(Response {
            server_group: server_group.into_api_object(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/order", order::router(state))
        .nest("/{server_group}", _server_group_::router(state))
        .with_state(state.clone())
}
