use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::routes::{
        ApiError, GetState,
        api::client::{GetAuthMethod, GetUser},
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
        ip: crate::GetIp,
        auth: GetAuthMethod,
        user: GetUser,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if !user
            .validate_password(&state.database, &data.password)
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&["invalid password"])),
            );
        }

        if user.email != data.email {
            if sqlx::query!(
                "UPDATE users SET email = $1 WHERE id = $2",
                data.email,
                user.id
            )
            .execute(state.database.write())
            .await
            .is_err()
            {
                return (
                    StatusCode::CONFLICT,
                    axum::Json(ApiError::new_value(&["user with email already exists"])),
                );
            }

            user.log_activity(
                &state.database,
                "user:account.email-changed",
                ip,
                auth,
                serde_json::json!({
                    "old": user.email,
                    "new": data.email,
                }),
            )
            .await;
        }

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
