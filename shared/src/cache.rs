use crate::{env::RedisMode, response::ApiResponse};
use axum::http::StatusCode;
use colored::Colorize;
use rustis::{
    client::Client,
    commands::{
        GenericCommands, InfoSection, ServerCommands, SetCondition, SetExpiration, StringCommands,
    },
    resp::BulkString,
};
use serde::{Serialize, de::DeserializeOwned};
use std::{collections::HashMap, future::Future, sync::Arc, time::Duration};
use tokio::sync::{Mutex, RwLock};

struct CacheEntry {
    value: Vec<u8>,
    expires_at: std::time::Instant,
}

pub struct Cache {
    pub client: Client,

    mutex_map: RwLock<HashMap<String, Arc<Mutex<()>>>>,
    memory_cache: Arc<RwLock<HashMap<String, CacheEntry>>>,
}

impl Cache {
    pub async fn new(env: &crate::env::Env) -> Self {
        let start = std::time::Instant::now();

        let instance = Self {
            client: match &env.redis_mode {
                RedisMode::Redis { redis_url } => Client::connect(redis_url.clone()).await.unwrap(),
                RedisMode::Sentinel {
                    cluster_name,
                    redis_sentinels,
                } => Client::connect(
                    format!(
                        "redis-sentinel://{}/{cluster_name}/0",
                        redis_sentinels.join(",")
                    )
                    .as_str(),
                )
                .await
                .unwrap(),
            },
            mutex_map: RwLock::new(HashMap::new()),
            memory_cache: Arc::new(RwLock::new(HashMap::new())),
        };

        let version = instance
            .version()
            .await
            .unwrap_or_else(|_| "unknown".to_string());

        tracing::info!(
            "{} connected {}",
            "cache".bright_yellow(),
            format!("(redis@{}, {}ms)", version, start.elapsed().as_millis()).bright_black()
        );

        let memory_cache = instance.memory_cache.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));

            loop {
                interval.tick().await;

                let now = std::time::Instant::now();
                memory_cache
                    .write()
                    .await
                    .retain(|_, entry| entry.expires_at > now);
            }
        });

        instance
    }

    pub async fn version(&self) -> Result<String, rustis::Error> {
        let version: String = self.client.info([InfoSection::Server]).await?;
        let version = version
            .lines()
            .find(|line| line.starts_with("redis_version:"))
            .unwrap()
            .split(':')
            .collect::<Vec<&str>>()[1]
            .to_string();

        Ok(version)
    }

    pub async fn ratelimit(
        &self,
        limit_identifier: impl AsRef<str>,
        limit: u64,
        limit_window: u64,
        client: impl Into<String>,
    ) -> Result<(), ApiResponse> {
        let key = format!(
            "ratelimit::{}::{}",
            limit_identifier.as_ref(),
            client.into()
        );

        let now = chrono::Utc::now().timestamp();
        let expiry = self.client.expiretime(&key).await.unwrap_or_default();
        let expire_unix: u64 = if expiry > now + 2 {
            expiry as u64
        } else {
            now as u64 + limit_window
        };

        let limit_used = self.client.get::<_, u64>(&key).await.unwrap_or_default() + 1;
        self.client
            .set_with_options(
                key,
                limit_used,
                SetCondition::None,
                SetExpiration::Exat(expire_unix),
                false,
            )
            .await?;

        if limit_used >= limit {
            return Err(ApiResponse::error(&format!(
                "you are ratelimited, retry in {}s",
                expiry - now
            ))
            .with_status(StatusCode::TOO_MANY_REQUESTS));
        }

        Ok(())
    }

    #[tracing::instrument(skip(self, fn_compute))]
    pub async fn cached<T, F, Fut, FutErr>(
        &self,
        key: &str,
        ttl: u64,
        fn_compute: F,
    ) -> Result<T, anyhow::Error>
    where
        T: Serialize + DeserializeOwned + Send,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, FutErr>>,
        FutErr: Into<anyhow::Error> + std::error::Error + Send + Sync + 'static,
    {
        let now = std::time::Instant::now();

        tracing::debug!("checking memory cache");
        if let Some(entry) = self.memory_cache.read().await.get(key) {
            if entry.expires_at > now {
                tracing::debug!("found in memory cache");
                match bincode::serde::decode_from_slice::<T, _>(
                    &entry.value,
                    bincode::config::standard(),
                ) {
                    Ok((value, _)) => return Ok(value),
                    Err(err) => {
                        tracing::warn!("failed to deserialize from memory cache: {:#?}", err);
                    }
                }
            }
        }

        tracing::debug!("checking redis cache");
        let cached_value: Option<BulkString> = self.client.get(key).await?;
        if let Some(value) = cached_value
            && let Ok((val, _)) = bincode::serde::decode_from_slice::<T, _>(
                value.as_bytes(),
                bincode::config::standard(),
            )
        {
            self.memory_cache.write().await.insert(
                key.to_string(),
                CacheEntry {
                    value: value.into(),
                    expires_at: now + Duration::from_secs(ttl),
                },
            );

            tracing::debug!("found in redis cache");
            return Ok(val);
        }

        let mutex = self
            .mutex_map
            .write()
            .await
            .entry(key.to_string())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone();

        tracing::debug!("locking mutex");
        let _guard = mutex.lock().await;
        tracing::debug!("locked mutex");

        if let Some(entry) = self.memory_cache.read().await.get(key) {
            if entry.expires_at > now {
                tracing::debug!("found in memory cache after lock");
                match bincode::serde::decode_from_slice::<T, _>(
                    &entry.value,
                    bincode::config::standard(),
                ) {
                    Ok((value, _)) => return Ok(value),
                    Err(err) => {
                        tracing::warn!("failed to deserialize from memory cache: {:#?}", err)
                    }
                }
            }
        }

        tracing::debug!("checking redis cache after lock");
        let cached_value: Option<BulkString> = self.client.get(key).await?;
        if let Some(value) = cached_value
            && let Ok((val, _)) = bincode::serde::decode_from_slice::<T, _>(
                value.as_bytes(),
                bincode::config::standard(),
            )
        {
            self.memory_cache.write().await.insert(
                key.to_string(),
                CacheEntry {
                    value: value.into(),
                    expires_at: now + Duration::from_secs(ttl),
                },
            );

            tracing::debug!("found in redis cache after lock");
            return Ok(val);
        }

        tracing::debug!("executing compute");
        let result = fn_compute().await?;
        tracing::debug!("executed compute");

        let serialized = bincode::serde::encode_to_vec(&result, bincode::config::standard())?;

        self.client
            .set_with_options(
                key,
                serialized.as_slice(),
                SetCondition::None,
                SetExpiration::Ex(ttl),
                false,
            )
            .await?;

        self.memory_cache.write().await.insert(
            key.to_string(),
            CacheEntry {
                value: serialized,
                expires_at: now + Duration::from_secs(ttl),
            },
        );

        Ok(result)
    }

    pub async fn invalidate(&self, key: &str) -> Result<(), anyhow::Error> {
        self.memory_cache.write().await.remove(key);
        self.client.del(key).await?;

        Ok(())
    }
}
