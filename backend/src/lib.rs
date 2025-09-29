pub mod cache;
pub mod captcha;
pub mod commands;
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
pub mod routes;
pub mod settings;
pub mod storage;
pub mod utils;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const GIT_COMMIT: &str = env!("CARGO_GIT_COMMIT");

pub type GetIp = axum::extract::Extension<std::net::IpAddr>;
