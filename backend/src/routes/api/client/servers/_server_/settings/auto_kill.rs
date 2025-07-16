use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        enabled: bool,

        #[validate(range(min = 1, max = 3600))]
        #[schema(minimum = 1, maximum = 3600)]
        seconds: Option<u64>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = UNAUTHORIZED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("settings.auto-kill") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        server.auto_kill.enabled = data.enabled;
        if let Some(seconds) = data.seconds {
            server.auto_kill.seconds = seconds;
        }

        sqlx::query!(
            "UPDATE servers
            SET auto_kill = $1
            WHERE id = $2",
            serde_json::to_value(&server.auto_kill).unwrap(),
            server.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        activity_logger
            .log(
                "server:settings.auto-kill",
                serde_json::json!({
                    "enabled": server.auto_kill.enabled,
                    "seconds": server.auto_kill.seconds,
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
        .routes(routes!(put::route))
        .with_state(state.clone())
}
