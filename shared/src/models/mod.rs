use crate::database::DatabaseError;
use futures_util::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    marker::PhantomData,
    pin::Pin,
    sync::{Arc, LazyLock},
};
use tokio::sync::RwLock;
use utoipa::ToSchema;
use validator::Validate;

pub mod admin_activity;
pub mod backup_configurations;
pub mod database_host;
pub mod egg_repository;
pub mod egg_repository_egg;
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
pub mod oauth_provider;
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
pub mod user_oauth_link;
pub mod user_password_reset;
pub mod user_recovery_code;
pub mod user_security_key;
pub mod user_server_group;
pub mod user_session;
pub mod user_ssh_key;

#[derive(ToSchema, Validate, Deserialize)]
pub struct PaginationParams {
    #[validate(range(min = 1))]
    #[schema(minimum = 1)]
    #[serde(default = "Pagination::default_page")]
    pub page: i64,
    #[validate(range(min = 1, max = 100))]
    #[schema(minimum = 1, maximum = 100)]
    #[serde(default = "Pagination::default_per_page")]
    pub per_page: i64,
}

#[derive(ToSchema, Validate, Deserialize)]
pub struct PaginationParamsWithSearch {
    #[validate(range(min = 1))]
    #[schema(minimum = 1)]
    #[serde(default = "Pagination::default_page")]
    pub page: i64,
    #[validate(range(min = 1, max = 100))]
    #[schema(minimum = 1, maximum = 100)]
    #[serde(default = "Pagination::default_per_page")]
    pub per_page: i64,
    #[validate(length(min = 1, max = 128))]
    #[schema(min_length = 1, max_length = 128)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_string_option"
    )]
    pub search: Option<compact_str::CompactString>,
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
        let mut results = Vec::new();
        results.reserve_exact(self.data.len());
        let mut result_stream =
            futures_util::stream::iter(self.data.into_iter().map(mapper)).buffered(25);

        while let Some(result) = result_stream.next().await {
            results.push(result);
        }

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
            futures_util::stream::iter(self.data.into_iter().map(mapper)).buffered(25);

        while let Some(result) = result_stream.try_next().await? {
            results.push(result);
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
    const NAME: &'static str;

    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString>;

    #[inline]
    fn columns_sql(prefix: Option<&str>) -> String {
        Self::columns(prefix)
            .iter()
            .map(|(key, value)| format!("{key} as {value}"))
            .collect::<Vec<String>>()
            .join(", ")
    }

    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError>;
}

type DeleteListenerResult<'a> =
    Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + 'a>>;
type DeleteListener<M> = dyn for<'a> Fn(
        &'a M,
        &'a <M as DeletableModel>::DeleteOptions,
        &'a Arc<crate::database::Database>,
        &'a mut sqlx::Transaction<'a, sqlx::Postgres>,
    ) -> DeleteListenerResult<'a>
    + Send
    + Sync;
pub type DeleteListenerList<M> = Arc<ListenerList<Box<DeleteListener<M>>>>;

#[async_trait::async_trait]
pub trait DeletableModel: BaseModel + Send + Sync + 'static {
    type DeleteOptions: Send + Sync + Default;

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>>;

    async fn add_delete_listener<
        F: for<'a> Fn(
                &'a Self,
                &'a Self::DeleteOptions,
                &'a Arc<crate::database::Database>,
                &'a mut sqlx::Transaction<'a, sqlx::Postgres>,
            )
                -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + 'a>>
            + Send
            + Sync
            + 'static,
    >(
        priority: ListenerPriority,
        callback: F,
    ) {
        let erased = Box::new(callback) as Box<DeleteListener<Self>>;

        Self::get_delete_listeners()
            .add_listener(priority, erased)
            .await;
    }

    /// # Warning
    /// This method will block the current thread if the lock is not available
    fn add_delete_listener_sync<
        F: for<'a> Fn(
                &'a Self,
                &'a Self::DeleteOptions,
                &'a Arc<crate::database::Database>,
                &'a mut sqlx::Transaction<'a, sqlx::Postgres>,
            )
                -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + 'a>>
            + Send
            + Sync
            + 'static,
    >(
        priority: ListenerPriority,
        callback: F,
    ) {
        let erased = Box::new(callback) as Box<DeleteListener<Self>>;

        Self::get_delete_listeners().add_listener_sync(priority, erased);
    }

    async fn run_delete_listeners(
        &self,
        options: &Self::DeleteOptions,
        database: &Arc<crate::database::Database>,
        transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> Result<(), anyhow::Error> {
        let listeners = Self::get_delete_listeners().listeners.read().await;

        for listener in listeners.iter() {
            let transaction_ref: &mut sqlx::Transaction<'_, sqlx::Postgres> = unsafe {
                std::mem::transmute(transaction as &mut sqlx::Transaction<'_, sqlx::Postgres>)
            };

            (*listener.callback)(self, options, database, transaction_ref).await?;
        }

        Ok(())
    }

    async fn delete(
        &self,
        database: &Arc<crate::database::Database>,
        options: Self::DeleteOptions,
    ) -> Result<(), anyhow::Error>;
}

#[async_trait::async_trait]
pub trait ByUuid: BaseModel {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, DatabaseError>;

    async fn by_uuid_cached(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, anyhow::Error> {
        database
            .cache
            .cached(&format!("{}::{uuid}", Self::NAME), 10, || {
                Self::by_uuid(database, uuid)
            })
            .await
    }

    async fn by_uuid_optional(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, DatabaseError> {
        match Self::by_uuid(database, uuid).await {
            Ok(res) => Ok(Some(res)),
            Err(DatabaseError::Sqlx(sqlx::Error::RowNotFound)) => Ok(None),
            Err(err) => Err(err),
        }
    }

    async fn by_uuid_optional_cached(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, anyhow::Error> {
        database
            .cache
            .cached(&format!("{}::{uuid}", Self::NAME), 10, || {
                Self::by_uuid_optional(database, uuid)
            })
            .await
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

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ListenerPriority {
    Highest,
    High,
    #[default]
    Normal,
    Low,
    Lowest,
}

impl ListenerPriority {
    #[inline]
    fn rank(self) -> u8 {
        match self {
            Self::Highest => 5,
            Self::High => 4,
            Self::Normal => 3,
            Self::Low => 2,
            Self::Lowest => 1,
        }
    }
}

impl PartialOrd for ListenerPriority {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ListenerPriority {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        let self_rank = self.rank();
        let other_rank = other.rank();

        other_rank.cmp(&self_rank)
    }
}

pub struct ListenerList<F> {
    listeners: RwLock<Vec<Listener<F>>>,
}

impl<F> Default for ListenerList<F> {
    fn default() -> Self {
        Self {
            listeners: RwLock::new(Vec::new()),
        }
    }
}

impl<F> ListenerList<F> {
    pub async fn add_listener(
        self: &Arc<Self>,
        priority: ListenerPriority,
        callback: F,
    ) -> ListenerAborter<F> {
        let listener = Listener::new(callback, priority, self.clone());
        let aborter = listener.aborter();

        let mut self_listeners = self.listeners.write().await;
        self_listeners.push(listener);
        self_listeners.sort_by(|a, b| a.priority.cmp(&b.priority));

        aborter
    }

    /// # Warning
    /// This method will block the current thread if the lock is not available
    pub fn add_listener_sync(
        self: &Arc<Self>,
        priority: ListenerPriority,
        callback: F,
    ) -> ListenerAborter<F> {
        let listener = Listener::new(callback, priority, self.clone());
        let aborter = listener.aborter();

        let mut self_listeners = self.listeners.blocking_write();
        self_listeners.push(listener);
        self_listeners.sort_by(|a, b| a.priority.cmp(&b.priority));

        aborter
    }
}

pub struct Listener<F> {
    uuid: uuid::Uuid,
    priority: ListenerPriority,
    list: Arc<ListenerList<F>>,

    pub callback: F,
}

impl<F> Listener<F> {
    pub fn new(callback: F, priority: ListenerPriority, list: Arc<ListenerList<F>>) -> Self {
        Self {
            uuid: uuid::Uuid::new_v4(),
            priority,
            list,
            callback,
        }
    }

    pub fn aborter(&self) -> ListenerAborter<F> {
        ListenerAborter {
            uuid: self.uuid,
            list: self.list.clone(),
        }
    }
}

pub struct ListenerAborter<F> {
    uuid: uuid::Uuid,
    list: Arc<ListenerList<F>>,
}

impl<F> ListenerAborter<F> {
    pub async fn abort(&self) {
        self.list
            .listeners
            .write()
            .await
            .retain(|l| l.uuid != self.uuid);
    }

    /// # Warning
    /// This method will block the current thread if the lists' lock is not available
    pub fn abort_sync(&self) {
        self.list
            .listeners
            .blocking_write()
            .retain(|l| l.uuid != self.uuid);
    }
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub struct Fetchable<M: ByUuid> {
    pub uuid: uuid::Uuid,
    #[serde(skip)]
    _model: PhantomData<M>,
}

impl<M: ByUuid + Send> Fetchable<M> {
    #[inline]
    pub async fn fetch(&self, database: &crate::database::Database) -> Result<M, DatabaseError> {
        M::by_uuid(database, self.uuid).await
    }

    #[inline]
    pub async fn fetch_cached(
        &self,
        database: &crate::database::Database,
    ) -> Result<M, anyhow::Error> {
        M::by_uuid_cached(database, self.uuid).await
    }

    #[inline]
    pub async fn fetch_optional(
        &self,
        database: &crate::database::Database,
    ) -> Result<Option<M>, DatabaseError> {
        M::by_uuid_optional(database, self.uuid).await
    }

    #[inline]
    pub async fn fetch_optional_cached(
        &self,
        database: &crate::database::Database,
    ) -> Result<Option<M>, anyhow::Error> {
        M::by_uuid_optional_cached(database, self.uuid).await
    }
}
