use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _backup_;

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{GetState, api::remote::GetNode},
    };
    use indexmap::IndexMap;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseRestic {
        repository: String,
        retry_lock_seconds: u64,
        environment: IndexMap<String, String>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        restic: Option<ResponseRestic>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, node: GetNode) -> ApiResponseResult {
        ApiResponse::json(Response {
            restic: match node.0.location.backup_configs.restic {
                Some(mut config) => {
                    config.decrypt(&state.database);

                    Some(ResponseRestic {
                        repository: config.repository,
                        retry_lock_seconds: config.retry_lock_seconds,
                        environment: config.environment,
                    })
                }
                None => None,
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/{backup}", _backup_::router(state))
        .with_state(state.clone())
}
