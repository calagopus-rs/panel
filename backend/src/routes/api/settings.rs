use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseApp<'a> {
        url: &'a str,
        name: &'a str,
        language: &'a str,
        registration_enabled: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct ResponseServer {
        max_file_manager_view_size: u64,
        max_file_manager_content_search_size: u64,
        max_file_manager_search_results: u64,
        max_schedules_step_count: u64,

        allow_overwriting_custom_docker_image: bool,
        allow_editing_startup_command: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        version: &'a str,
        oobe_step: Option<&'a str>,

        #[schema(inline)]
        captcha_provider: shared::settings::PublicCaptchaProvider<'a>,
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
            version: &state.version,
            oobe_step: settings.oobe_step.as_deref(),
            captcha_provider: settings.captcha_provider.to_public_provider(),
            app: ResponseApp {
                url: &settings.app.url,
                name: &settings.app.name,
                language: &settings.app.language,
                registration_enabled: settings.app.registration_enabled,
            },
            server: ResponseServer {
                max_file_manager_view_size: settings.server.max_file_manager_view_size,
                max_file_manager_content_search_size: settings
                    .server
                    .max_file_manager_content_search_size,
                max_file_manager_search_results: settings.server.max_file_manager_search_results,
                max_schedules_step_count: settings.server.max_schedules_step_count,

                allow_overwriting_custom_docker_image: settings
                    .server
                    .allow_overwriting_custom_docker_image,
                allow_editing_startup_command: settings.server.allow_editing_startup_command,
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
