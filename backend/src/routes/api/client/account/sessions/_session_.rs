use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            DeletableModel,
            user::{GetPermissionManager, GetUser},
            user_activity::GetUserActivityLogger,
            user_session::UserSession,
        },
        response::{ApiResponse, ApiResponseResult},
    };
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
        permissions: GetPermissionManager,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(session): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        permissions.has_user_permission("sessions.delete")?;

        let session =
            match UserSession::by_user_uuid_uuid(&state.database, user.uuid, session).await? {
                Some(session) => session,
                None => {
                    return ApiResponse::error("session not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        session.delete(&state.database, ()).await?;

        activity_logger
            .log(
                "session:delete",
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
