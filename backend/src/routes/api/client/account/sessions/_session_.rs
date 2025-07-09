use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::user_session::UserSession,
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
            "session" = i32,
            description = "The session ID",
            example = "1",
        ),
    ))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        Path(session): Path<i32>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let session = match UserSession::by_user_id_id(&state.database, user.id, session).await {
            Some(session) => session,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["session not found"])),
                );
            }
        };

        UserSession::delete_by_id(&state.database, session.id).await;

        activity_logger
            .log(
                "user:session.delete",
                serde_json::json!({
                    "session": session.id,
                    "user_agent": session.user_agent,
                    "ip": session.ip,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .with_state(state.clone())
}
