use colored::Colorize;
use sqlx::postgres::PgPoolOptions;
use std::{collections::HashMap, sync::Arc};
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
    ) -> Result<String, anyhow::Error> {
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
                                .map(|s| String::from_utf8_lossy(&s).to_string())
                        })
                        .await?
                    },
                )
                .await;
        }

        let encryption_key = self.encryption_key.clone();

        tokio::task::spawn_blocking(move || {
            simple_crypt::decrypt(data.as_ref(), encryption_key.as_bytes())
                .map(|s| String::from_utf8_lossy(&s).to_string())
        })
        .await?
    }

    #[inline]
    pub fn decrypt_sync(&self, data: impl AsRef<[u8]>) -> Option<String> {
        simple_crypt::decrypt(data.as_ref(), self.encryption_key.as_bytes())
            .map(|s| String::from_utf8_lossy(&s).to_string())
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
