use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sqlx::postgres::PgRow;
use std::collections::BTreeMap;
use utoipa::ToSchema;
use validator::Validate;

pub mod admin_activity;
pub mod database_host;
pub mod location;
pub mod location_database_host;
pub mod mount;
pub mod nest;
pub mod nest_egg;
pub mod nest_egg_mount;
pub mod nest_egg_variable;
pub mod node;
pub mod node_allocation;
pub mod node_mount;
pub mod server;
pub mod server_activity;
pub mod server_allocation;
pub mod server_backup;
pub mod server_database;
pub mod server_mount;
pub mod server_schedule;
pub mod server_schedule_step;
pub mod server_subuser;
pub mod server_variable;
pub mod user;
pub mod user_activity;
pub mod user_api_key;
pub mod user_password_reset;
pub mod user_recovery_code;
pub mod user_session;
pub mod user_ssh_key;

#[derive(ToSchema, Validate, Deserialize)]
pub struct PaginationParams {
    #[validate(range(min = 1))]
    #[serde(default = "Pagination::default_page")]
    pub page: i64,
    #[validate(range(min = 1, max = 100))]
    #[serde(default = "Pagination::default_per_page")]
    pub per_page: i64,
}

#[derive(ToSchema, Validate, Deserialize)]
pub struct PaginationParamsWithSearch {
    #[validate(range(min = 1))]
    #[serde(default = "Pagination::default_page")]
    pub page: i64,
    #[validate(range(min = 1, max = 100))]
    #[serde(default = "Pagination::default_per_page")]
    pub per_page: i64,
    #[validate(length(min = 1, max = 100))]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_string_option"
    )]
    pub search: Option<String>,
}

#[derive(ToSchema, Serialize)]
pub struct Pagination<T: Serialize = serde_json::Value> {
    pub total: i64,
    pub per_page: i64,
    pub page: i64,

    pub data: Vec<T>,
}

impl Pagination {
    pub const fn default_page() -> i64 {
        1
    }

    pub const fn default_per_page() -> i64 {
        25
    }
}

pub trait BaseModel: Serialize + DeserializeOwned {
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String>;

    #[inline]
    fn columns_sql(prefix: Option<&str>, table: Option<&str>) -> String {
        Self::columns(prefix, table)
            .iter()
            .map(|(key, value)| format!("{key} as {value}"))
            .collect::<Vec<String>>()
            .join(", ")
    }

    fn map(prefix: Option<&str>, row: &PgRow) -> Self;
}
