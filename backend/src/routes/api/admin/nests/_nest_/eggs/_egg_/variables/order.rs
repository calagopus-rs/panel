use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod put {
    use crate::routes::api::admin::nests::_nest_::eggs::_egg_::GetNestEgg;
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        variable_order: Vec<uuid::Uuid>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        egg: GetNestEgg,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("eggs.update")?;

        sqlx::query!(
            "UPDATE nest_egg_variables
            SET order_ = array_position($1, nest_egg_variables.uuid)
            WHERE nest_egg_variables.uuid = ANY($1) AND nest_egg_variables.egg_uuid = $2",
            &data.variable_order,
            egg.uuid
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "nest:egg.variable.update-order",
                serde_json::json!({
                    "variable_order": data.variable_order,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(put::route))
        .with_state(state.clone())
}
