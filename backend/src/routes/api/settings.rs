use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::GetState;
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseServer {
        allow_overwriting_custom_docker_image: bool,
        allow_editing_startup_command: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        captcha_provider: crate::settings::PublicCaptchaProvider<'a>,

        #[schema(inline)]
        server: ResponseServer,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState) -> (StatusCode, axum::Json<serde_json::Value>) {
        let settings = state.settings.get().await;

        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    captcha_provider: settings.captcha_provider.to_public_provider(),
                    server: ResponseServer {
                        allow_overwriting_custom_docker_image: settings
                            .server
                            .allow_overwriting_custom_docker_image,
                        allow_editing_startup_command: settings
                            .server
                            .allow_editing_startup_command,
                    },
                })
                .unwrap(),
            ),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
