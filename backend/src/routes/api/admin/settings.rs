use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        settings: &'a shared::settings::AppSettings,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("settings.read")?;

        let settings = state.settings.get().await;

        ApiResponse::json(Response {
            settings: &settings,
        })
        .ok()
    }
}

mod put {
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
    pub struct PayloadApp {
        name: Option<compact_str::CompactString>,
        #[validate(url)]
        url: Option<compact_str::CompactString>,
        #[validate(
            length(min = 5, max = 15),
            custom(function = "shared::validate_language")
        )]
        language: Option<compact_str::CompactString>,
        telemetry_enabled: Option<bool>,
        registration_enabled: Option<bool>,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct PayloadWebauthn {
        rp_id: Option<compact_str::CompactString>,
        #[validate(url)]
        rp_origin: Option<compact_str::CompactString>,
    }

    #[derive(ToSchema, Deserialize)]
    pub struct PayloadServer {
        max_file_manager_view_size: Option<u64>,
        max_schedules_step_count: Option<u64>,

        allow_overwriting_custom_docker_image: Option<bool>,
        allow_editing_startup_command: Option<bool>,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        oobe_step: Option<compact_str::CompactString>,

        storage_driver: Option<shared::settings::StorageDriver>,
        mail_mode: Option<shared::settings::MailMode>,
        captcha_provider: Option<shared::settings::CaptchaProvider>,

        #[schema(inline)]
        app: Option<PayloadApp>,
        #[schema(inline)]
        webauthn: Option<PayloadWebauthn>,
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
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("settings.update")?;

        let mut settings = state.settings.get_mut().await;

        if let Some(oobe_step) = data.oobe_step {
            if oobe_step.is_empty() {
                if settings.oobe_step.is_some() {
                    settings.oobe_step = None;
                }
            } else {
                settings.oobe_step = Some(oobe_step);
            }
        }
        if let Some(storage_driver) = data.storage_driver {
            settings.storage_driver = storage_driver;
        }
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
            if let Some(url) = app.url {
                settings.app.url = url;
            }
            if let Some(language) = app.language {
                settings.app.language = language;
            }
            if let Some(telemetry_enabled) = app.telemetry_enabled {
                settings.app.telemetry_enabled = telemetry_enabled;
            }
            if let Some(registration_enabled) = app.registration_enabled {
                settings.app.registration_enabled = registration_enabled;
            }
        }
        if let Some(webauthn) = data.webauthn {
            if let Some(rp_id) = webauthn.rp_id {
                settings.webauthn.rp_id = rp_id;
            }
            if let Some(rp_origin) = webauthn.rp_origin {
                settings.webauthn.rp_origin = rp_origin;
            }
        }
        if let Some(server) = data.server {
            if let Some(max_file_manager_view_size) = server.max_file_manager_view_size {
                settings.server.max_file_manager_view_size = max_file_manager_view_size;
            }
            if let Some(max_schedules_step_count) = server.max_schedules_step_count {
                settings.server.max_schedules_step_count = max_schedules_step_count;
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

        let settings_json = settings.censored();
        settings.save().await?;

        activity_logger.log("settings:update", settings_json).await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
