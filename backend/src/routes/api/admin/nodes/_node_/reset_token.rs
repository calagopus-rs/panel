use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::admin::{GetAdminActivityLogger, nodes::_node_::GetNode},
        },
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        token_id: String,
        token: String,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "node" = uuid::Uuid,
            description = "The node ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        activity_logger: GetAdminActivityLogger,
    ) -> ApiResponseResult {
        let (token_id, token) = node.reset_token(&state.database).await?;

        activity_logger
            .log(
                "node:reset-token",
                serde_json::json!({
                    "node_uuid": node.uuid,
                }),
            )
            .await;

        ApiResponse::json(Response { token_id, token }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
