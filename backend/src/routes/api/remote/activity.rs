use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{server_activity::ServerActivity, user::User},
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState},
    };
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct PayloadActivity {
        user: Option<uuid::Uuid>,
        server: uuid::Uuid,
        event: String,
        metadata: Option<serde_json::Value>,

        #[schema(value_type = Option<String>)]
        ip: Option<std::net::IpAddr>,
        timestamp: chrono::DateTime<chrono::Utc>,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        #[schema(inline)]
        data: Vec<PayloadActivity>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        for activity in data.data {
            if let Err(err) = ServerActivity::log_remote(
                &state.database,
                activity.server,
                activity.user.map(User::from_uuid),
                None,
                &activity.event,
                activity.ip.map(|ip| ip.into()),
                activity.metadata.unwrap_or_else(|| serde_json::json!({})),
                activity.timestamp,
            )
            .await
            {
                tracing::warn!(
                    server = %activity.server,
                    "failed to log remote activity for server: {:#?}",
                    err
                );
            }
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
