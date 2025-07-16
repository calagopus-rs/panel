use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::routes::{
        ApiError, GetState,
        api::client::servers::_server_::{GetServer, GetServerActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use std::str::FromStr;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        timezone: Option<String>,
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Err(error) = server.has_permission("settings.timezone") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        if let Some(timezone) = &data.timezone {
            if chrono_tz::Tz::from_str(timezone).is_err() {
                return (
                    StatusCode::BAD_REQUEST,
                    axum::Json(ApiError::new_value(&["invalid timezone"])),
                );
            }
        }

        sqlx::query!(
            "UPDATE servers
            SET timezone = $1
            WHERE id = $2",
            data.timezone,
            server.id
        )
        .execute(state.database.write())
        .await
        .unwrap();

        activity_logger
            .log(
                "server:settings.timezone",
                serde_json::json!({
                    "timezone": data.timezone,
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
