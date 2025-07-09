use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use crate::routes::GetState;
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        settings: &'a crate::settings::AppSettings,
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
                    settings: &settings,
                })
                .unwrap(),
            ),
        )
    }
}

mod put {
    use crate::routes::{GetState, api::client::GetUserActivityLogger};
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct PayloadApp {
        name: Option<String>,
        icon: Option<String>,
        url: Option<String>,
        telemetry_enabled: Option<bool>,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct PayloadServer {
        max_file_manager_view_size: Option<u64>,

        allow_overwriting_custom_docker_image: Option<bool>,
        allow_editing_startup_command: Option<bool>,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        mail_mode: Option<crate::settings::MailMode>,
        captcha_provider: Option<crate::settings::CaptchaProvider>,

        #[schema(inline)]
        app: Option<PayloadApp>,
        #[schema(inline)]
        server: Option<PayloadServer>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let mut settings = state.settings.get_mut().await;

        if let Some(mail_mode) = data.mail_mode {
            settings.mail_mode = mail_mode;
        }
        if let Some(captcha_provider) = data.captcha_provider {
            settings.captcha_provider = captcha_provider;
        }
        if let Some(app) = data.app {
            if let Some(name) = app.name {
                settings.app.name = name;
            }
            if let Some(icon) = app.icon {
                if icon.is_empty() {
                    settings.app.icon = None;
                } else {
                    settings.app.icon = Some(icon);
                }
            }
            if let Some(url) = app.url {
                settings.app.url = url;
            }
            if let Some(telemetry_enabled) = app.telemetry_enabled {
                settings.app.telemetry_enabled = telemetry_enabled;
            }
        }
        if let Some(server) = data.server {
            if let Some(max_file_manager_view_size) = server.max_file_manager_view_size {
                settings.server.max_file_manager_view_size = max_file_manager_view_size;
            }
            if let Some(allow_overwriting_custom_docker_image) =
                server.allow_overwriting_custom_docker_image
            {
                settings.server.allow_overwriting_custom_docker_image =
                    allow_overwriting_custom_docker_image;
            }
            if let Some(allow_editing_startup_command) = server.allow_editing_startup_command {
                settings.server.allow_editing_startup_command = allow_editing_startup_command;
            }
        }

        let settings_json = serde_json::to_value(&*settings).unwrap();
        settings.save().await.unwrap();

        activity_logger
            .log("admin:settings.update", settings_json)
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
