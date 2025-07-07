use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        models::{server_activity::ServerActivity, user::User},
        routes::{ApiError, GetState},
    };
    use axum::http::StatusCode;
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
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        for activity in data.data {
            if let Err(err) = ServerActivity::log_remote(
                &state.database,
                activity.server,
                activity.user.map(|uuid| User::from_uuid(uuid)),
                None,
                &activity.event,
                activity
                    .ip
                    .unwrap_or(std::net::IpAddr::from([127, 0, 0, 1]))
                    .into(),
                activity.metadata.unwrap_or_default(),
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

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
