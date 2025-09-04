use crate::{env::RedisMode, response::ApiResponse};
use axum::http::StatusCode;
use colored::Colorize;
use rustis::{
    client::Client,
    commands::{
        GenericCommands, InfoSection, ServerCommands, SetCondition, SetExpiration, StringCommands,
    },
};
use serde::{Serialize, de::DeserializeOwned};
use std::future::Future;

pub struct Cache {
    pub client: Client,
}

impl Cache {
    pub async fn new(env: &crate::env::Env) -> Self {
        let start = std::time::Instant::now();

        let instance = Self {
            client: match &env.redis_mode {
                RedisMode::Redis { redis_url } => Client::connect(redis_url.clone()).await.unwrap(),
                RedisMode::Sentinel { redis_sentinels } => Client::connect(
                    format!("redis-sentinel://{}/mymaster/0", redis_sentinels.join(",")).as_str(),
                )
                .await
                .unwrap(),
            },
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

    pub async fn cached<T, F, Fut>(
        &self,
        key: &str,
        ttl: u64,
        fn_compute: F,
    ) -> Result<T, anyhow::Error>
    where
        T: Serialize + DeserializeOwned,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, anyhow::Error>>,
    {
        let cached_value: Option<String> = self.client.get(key).await?;

        match cached_value {
            Some(value) => {
                let result: T = serde_json::from_str(&value)?;

                Ok(result)
            }
            None => {
                let result = fn_compute().await?;

                let serialized = serde_json::to_string(&result)?;
                self.client
                    .set_with_options(
                        key,
                        serialized,
                        SetCondition::None,
                        SetExpiration::Ex(ttl),
                        false,
                    )
                    .await?;

                Ok(result)
            }
        }
    }

    #[inline]
    pub async fn clear_organization(&self, organization: i32) {
        let keys: Vec<String> = self
            .client
            .keys(format!("organization::{organization}*"))
            .await
            .unwrap();

        if !keys.is_empty() {
            self.client.del(keys).await.unwrap();
        }
    }
}
