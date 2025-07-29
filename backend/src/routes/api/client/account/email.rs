use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{GetUser, GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(email)]
        #[schema(format = "email")]
        email: String,
        #[validate(length(max = 512))]
        #[schema(max_length = 512)]
        password: String,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        user: GetUser,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if !user
            .validate_password(&state.database, &data.password)
            .await?
        {
            return ApiResponse::error("invalid password")
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        if user.email != data.email {
            match sqlx::query!(
                "UPDATE users SET email = $1 WHERE id = $2",
                data.email,
                user.id
            )
            .execute(state.database.write())
            .await
            {
                Ok(_) => {}
                Err(err) if err.to_string().contains("unique constraint") => {
                    return ApiResponse::error("email already in use")
                        .with_status(StatusCode::CONFLICT)
                        .ok();
                }
                Err(err) => {
                    tracing::error!("failed to update user email: {:#?}", err);

                    return ApiResponse::error("failed to update user email")
                        .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                        .ok();
                }
            }

            activity_logger
                .log(
                    "user:account.email-changed",
                    serde_json::json!({
                        "old": user.email,
                        "new": data.email,
                    }),
                )
                .await;
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
