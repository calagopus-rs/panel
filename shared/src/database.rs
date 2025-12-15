use colored::Colorize;
use sqlx::postgres::PgPoolOptions;
use std::{collections::HashMap, fmt::Display, sync::Arc};
use tokio::sync::Mutex;

type EmptyFuture = Box<dyn Future<Output = ()> + Send>;
pub struct Database {
    pub cache: Arc<crate::cache::Cache>,

    write: sqlx::PgPool,
    read: Option<sqlx::PgPool>,

    encryption_key: Arc<str>,
    use_decryption_cache: bool,
    batch_actions: Arc<Mutex<HashMap<(&'static str, uuid::Uuid), EmptyFuture>>>,
}

impl Database {
    pub async fn new(env: &crate::env::Env, cache: Arc<crate::cache::Cache>) -> Self {
        let start = std::time::Instant::now();

        let instance = Self {
            cache,

            write: match &env.database_url_primary {
                Some(url) => PgPoolOptions::new()
                    .min_connections(10)
                    .max_connections(20)
                    .test_before_acquire(false)
                    .connect(url)
                    .await
                    .unwrap(),

                None => PgPoolOptions::new()
                    .min_connections(10)
                    .max_connections(50)
                    .test_before_acquire(false)
                    .connect(&env.database_url)
                    .await
                    .unwrap(),
            },
            read: if env.database_url_primary.is_some() {
                Some(
                    PgPoolOptions::new()
                        .min_connections(10)
                        .max_connections(50)
                        .test_before_acquire(false)
                        .connect(&env.database_url)
                        .await
                        .unwrap(),
                )
            } else {
                None
            },

            encryption_key: env.app_encryption_key.clone().into(),
            use_decryption_cache: env.app_use_decryption_cache,
            batch_actions: Arc::new(Mutex::new(HashMap::new())),
        };

        let version = instance
            .version()
            .await
            .unwrap_or_else(|_| "unknown".to_string());

        tracing::info!(
            "{} connected {}",
            "database".bright_cyan(),
            format!(
                "(postgres@{}, {}ms)",
                version.bright_black(),
                start.elapsed().as_millis()
            )
            .bright_black()
        );

        tokio::spawn({
            let batch_actions = instance.batch_actions.clone();

            async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

                    let mut actions = batch_actions.lock().await;
                    for (key, action) in actions.drain() {
                        tracing::debug!(
                            "executing batch action for {}:{}",
                            key.0.bright_cyan(),
                            key.1
                        );
                        Box::into_pin(action).await;
                    }
                }
            }
        });

        instance
    }

    pub async fn version(&self) -> Result<String, sqlx::Error> {
        let version: (String,) = sqlx::query_as("SELECT split_part(version(), ' ', 2)")
            .fetch_one(self.read())
            .await?;

        Ok(version.0)
    }

    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        let start = std::time::Instant::now();

        sqlx::migrate!("../database/migrations")
            .run(&self.write)
            .await?;

        tracing::info!(
            "{} migrated {}",
            "database".bright_cyan(),
            format!("({}ms)", start.elapsed().as_millis()).bright_black()
        );

        Ok(())
    }

    #[inline]
    pub fn write(&self) -> &sqlx::PgPool {
        &self.write
    }

    #[inline]
    pub fn read(&self) -> &sqlx::PgPool {
        self.read.as_ref().unwrap_or(&self.write)
    }

    #[inline]
    pub async fn encrypt(
        &self,
        data: impl AsRef<[u8]> + Send + 'static,
    ) -> Result<Vec<u8>, anyhow::Error> {
        let encryption_key = self.encryption_key.clone();

        tokio::task::spawn_blocking(move || {
            simple_crypt::encrypt(data.as_ref(), encryption_key.as_bytes())
        })
        .await?
    }

    #[inline]
    pub fn encrypt_sync(&self, data: impl AsRef<[u8]>) -> Option<Vec<u8>> {
        simple_crypt::encrypt(data.as_ref(), self.encryption_key.as_bytes()).ok()
    }

    #[inline]
    pub async fn decrypt(
        &self,
        data: impl AsRef<[u8]> + Send + 'static,
    ) -> Result<compact_str::CompactString, anyhow::Error> {
        if self.use_decryption_cache {
            return self
                .cache
                .cached(
                    &format!(
                        "decryption_cache::{}",
                        base32::encode(base32::Alphabet::Z, data.as_ref())
                    ),
                    30,
                    || async {
                        let encryption_key = self.encryption_key.clone();
                        let data = data.as_ref().to_vec();

                        tokio::task::spawn_blocking(move || {
                            simple_crypt::decrypt(&data, encryption_key.as_bytes())
                                .map(|s| compact_str::CompactString::from_utf8_lossy(&s))
                        })
                        .await?
                    },
                )
                .await;
        }

        let encryption_key = self.encryption_key.clone();

        tokio::task::spawn_blocking(move || {
            simple_crypt::decrypt(data.as_ref(), encryption_key.as_bytes())
                .map(|s| compact_str::CompactString::from_utf8_lossy(&s))
        })
        .await?
    }

    #[inline]
    pub fn decrypt_sync(&self, data: impl AsRef<[u8]>) -> Option<compact_str::CompactString> {
        simple_crypt::decrypt(data.as_ref(), self.encryption_key.as_bytes())
            .map(|s| compact_str::CompactString::from_utf8_lossy(&s))
            .ok()
    }

    #[inline]
    pub async fn batch_action<F>(&self, key: &'static str, uuid: uuid::Uuid, action: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        let mut actions = self.batch_actions.lock().await;
        actions.insert((key, uuid), Box::new(action));
    }
}

#[derive(Debug)]
pub enum DatabaseError {
    Sqlx(sqlx::Error),
    Serde(serde_json::Error),
    Any(anyhow::Error),
}

impl Display for DatabaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Sqlx(sqlx_value) => sqlx_value.fmt(f),
            Self::Serde(serde_value) => serde_value.fmt(f),
            Self::Any(any_value) => any_value.fmt(f),
        }
    }
}

impl From<wings_api::client::ApiHttpError> for DatabaseError {
    #[inline]
    fn from(value: wings_api::client::ApiHttpError) -> Self {
        Self::Any(value.into())
    }
}

impl From<anyhow::Error> for DatabaseError {
    #[inline]
    fn from(value: anyhow::Error) -> Self {
        Self::Any(value)
    }
}

impl From<serde_json::Error> for DatabaseError {
    #[inline]
    fn from(value: serde_json::Error) -> Self {
        Self::Serde(value)
    }
}

impl From<sqlx::Error> for DatabaseError {
    #[inline]
    fn from(value: sqlx::Error) -> Self {
        Self::Sqlx(value)
    }
}

impl DatabaseError {
    #[inline]
    pub fn is_unique_violation(&self) -> bool {
        match self {
            Self::Sqlx(sqlx_value) => sqlx_value
                .as_database_error()
                .is_some_and(|e| e.is_unique_violation()),
            _ => false,
        }
    }

    #[inline]
    pub fn is_foreign_key_violation(&self) -> bool {
        match self {
            Self::Sqlx(sqlx_value) => sqlx_value
                .as_database_error()
                .is_some_and(|e| e.is_foreign_key_violation()),
            _ => false,
        }
    }

    #[inline]
    pub fn is_check_violation(&self) -> bool {
        match self {
            Self::Sqlx(sqlx_value) => sqlx_value
                .as_database_error()
                .is_some_and(|e| e.is_check_violation()),
            _ => false,
        }
    }
}

impl From<DatabaseError> for anyhow::Error {
    #[inline]
    fn from(value: DatabaseError) -> Self {
        match value {
            DatabaseError::Sqlx(sqlx_value) => anyhow::anyhow!(sqlx_value),
            DatabaseError::Serde(serde_value) => anyhow::anyhow!(serde_value),
            DatabaseError::Any(any_value) => any_value,
        }
    }
}
