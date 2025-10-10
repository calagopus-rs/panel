use futures_util::StreamExt;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, marker::PhantomData};
use utoipa::ToSchema;
use validator::Validate;

pub mod admin_activity;
pub mod backup_configurations;
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
pub mod role;
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
pub mod user_security_key;
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
    #[inline]
    pub const fn default_page() -> i64 {
        1
    }

    #[inline]
    pub const fn default_per_page() -> i64 {
        25
    }
}

impl<T: Serialize> Pagination<T> {
    pub async fn async_map<R: serde::Serialize, Fut: Future<Output = R>>(
        self,
        mapper: impl Fn(T) -> Fut,
    ) -> Pagination<R> {
        let results: Vec<R> = futures_util::stream::iter(self.data.into_iter().map(mapper))
            .buffer_unordered(10)
            .collect()
            .await;

        Pagination {
            total: self.total,
            per_page: self.per_page,
            page: self.page,
            data: results,
        }
    }

    pub async fn try_async_map<R: serde::Serialize, E, Fut: Future<Output = Result<R, E>>>(
        self,
        mapper: impl Fn(T) -> Fut,
    ) -> Result<Pagination<R>, E> {
        let mut results = Vec::new();
        results.reserve_exact(self.data.len());
        let mut result_stream =
            futures_util::stream::iter(self.data.into_iter().map(mapper)).buffer_unordered(10);

        while let Some(result) = result_stream.next().await {
            results.push(result?);
        }

        Ok(Pagination {
            total: self.total,
            per_page: self.per_page,
            page: self.page,
            data: results,
        })
    }
}

pub trait BaseModel: Serialize + DeserializeOwned {
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String>;

    #[inline]
    fn columns_sql(prefix: Option<&str>) -> String {
        Self::columns(prefix)
            .iter()
            .map(|(key, value)| format!("{key} as {value}"))
            .collect::<Vec<String>>()
            .join(", ")
    }

    fn map(prefix: Option<&str>, row: &PgRow) -> Self;
}

#[async_trait::async_trait]
pub trait ByUuid: BaseModel {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, sqlx::Error>;

    async fn by_uuid_optional(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        match Self::by_uuid(database, uuid).await {
            Ok(res) => Ok(Some(res)),
            Err(sqlx::Error::RowNotFound) => Ok(None),
            Err(err) => Err(err),
        }
    }

    #[inline]
    fn get_fetchable(uuid: uuid::Uuid) -> Fetchable<Self> {
        Fetchable {
            uuid,
            _model: PhantomData,
        }
    }

    #[inline]
    fn get_fetchable_from_row(row: &PgRow, column: impl AsRef<str>) -> Option<Fetchable<Self>> {
        match row.try_get(column.as_ref()) {
            Ok(uuid) => Some(Fetchable {
                uuid,
                _model: PhantomData,
            }),
            Err(_) => None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub struct Fetchable<M: ByUuid> {
    pub uuid: uuid::Uuid,
    #[serde(skip)]
    _model: PhantomData<M>,
}

impl<M: ByUuid> Fetchable<M> {
    #[inline]
    pub async fn fetch(&self, database: &crate::database::Database) -> Result<M, sqlx::Error> {
        M::by_uuid(database, self.uuid).await
    }

    #[inline]
    pub async fn fetch_optional(
        &self,
        database: &crate::database::Database,
    ) -> Result<Option<M>, sqlx::Error> {
        match M::by_uuid(database, self.uuid).await {
            Ok(res) => Ok(Some(res)),
            Err(sqlx::Error::RowNotFound) => Ok(None),
            Err(err) => Err(err),
        }
    }
}
