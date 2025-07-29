use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::GetState,
    };
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseApp<'a> {
        name: &'a str,
        icon: Option<&'a str>,
        registration_enabled: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct ResponseServer {
        allow_overwriting_custom_docker_image: bool,
        allow_editing_startup_command: bool,
        max_file_manager_view_size: u64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        captcha_provider: crate::settings::PublicCaptchaProvider<'a>,

        #[schema(inline)]
        app: ResponseApp<'a>,
        #[schema(inline)]
        server: ResponseServer,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState) -> ApiResponseResult {
        let settings = state.settings.get().await;

        ApiResponse::json(Response {
            captcha_provider: settings.captcha_provider.to_public_provider(),
            app: ResponseApp {
                name: &settings.app.name,
                icon: settings.app.icon.as_deref(),
                registration_enabled: settings.app.registration_enabled,
            },
            server: ResponseServer {
                allow_overwriting_custom_docker_image: settings
                    .server
                    .allow_overwriting_custom_docker_image,
                allow_editing_startup_command: settings.server.allow_editing_startup_command,
                max_file_manager_view_size: settings.server.max_file_manager_view_size,
            },
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
