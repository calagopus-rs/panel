use serde::Serialize;
use std::{sync::Arc, time::Instant};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

pub mod api;

#[derive(ToSchema, Serialize)]
pub struct ApiError {
    pub errors: Vec<String>,
}

impl ApiError {
    #[inline]
    pub fn new_value(errors: &[&str]) -> serde_json::Value {
        serde_json::json!({
            "errors": errors,
        })
    }

    #[inline]
    pub fn new_strings_value(errors: Vec<String>) -> serde_json::Value {
        serde_json::json!({
            "errors": errors,
        })
    }

    #[inline]
    pub fn new_wings_value(error: wings_api::ApiError) -> serde_json::Value {
        serde_json::json!({
            "errors": [error.error],
        })
    }
}

pub struct AppState {
    pub start_time: Instant,
    pub version: String,

    pub settings: Arc<crate::settings::Settings>,
    pub jwt: Arc<crate::jwt::Jwt>,
    pub captcha: Arc<crate::captcha::Captcha>,
    pub email: Arc<crate::mail::Mail>,
    pub database: Arc<crate::database::Database>,
    pub cache: Arc<crate::cache::Cache>,
    pub env: Arc<crate::env::Env>,
    //pub s3: Arc<crate::s3::S3>,
}

pub type State = Arc<AppState>;
pub type GetState = axum::extract::State<State>;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/api", api::router(state))
        .with_state(state.clone())
}
