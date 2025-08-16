use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_session::UserSession,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "session" = uuid::Uuid,
            description = "The session ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(session): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        let session =
            match UserSession::by_user_uuid_uuid(&state.database, user.uuid, session).await? {
                Some(session) => session,
                None => {
                    return ApiResponse::error("session not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        UserSession::delete_by_uuid(&state.database, session.uuid).await?;

        activity_logger
            .log(
                "user:session.delete",
                serde_json::json!({
                    "uuid": session.uuid,
                    "user_agent": session.user_agent,
                    "ip": session.ip,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
