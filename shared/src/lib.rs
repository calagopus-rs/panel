use serde::Serialize;
use std::{sync::Arc, time::Instant};
use utoipa::ToSchema;

pub mod cache;
pub mod cap;
pub mod captcha;
pub mod database;
pub mod deserialize;
pub mod env;
pub mod extensions;
pub mod extract;
pub mod jwt;
pub mod mail;
pub mod models;
pub mod permissions;
pub mod response;
pub mod settings;
pub mod storage;
pub mod utils;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const GIT_COMMIT: &str = env!("CARGO_GIT_COMMIT");
pub const TARGET: &str = env!("CARGO_TARGET");

pub type GetIp = axum::extract::Extension<std::net::IpAddr>;

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

    pub client: reqwest::Client,

    pub extensions: Arc<extensions::manager::ExtensionManager>,
    pub settings: Arc<settings::Settings>,
    pub jwt: Arc<jwt::Jwt>,
    pub storage: Arc<storage::Storage>,
    pub captcha: Arc<captcha::Captcha>,
    pub mail: Arc<mail::Mail>,
    pub database: Arc<database::Database>,
    pub cache: Arc<cache::Cache>,
    pub env: Arc<env::Env>,
}

pub type State = Arc<AppState>;
pub type GetState = axum::extract::State<State>;

#[inline(always)]
#[cold]
fn cold_path() {}

#[inline(always)]
pub fn likely(b: bool) -> bool {
    if b {
        true
    } else {
        cold_path();
        false
    }
}

#[inline(always)]
pub fn unlikely(b: bool) -> bool {
    if b {
        cold_path();
        true
    } else {
        false
    }
}
