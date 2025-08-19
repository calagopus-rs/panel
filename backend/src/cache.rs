use crate::env::RedisMode;
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

    #[inline]
    pub async fn cached<T, F, Fut>(&self, key: &str, ttl: u64, fn_compute: F) -> T
    where
        T: Serialize + DeserializeOwned,
        F: FnOnce() -> Fut,
        Fut: Future<Output = T>,
    {
        let cached_value: Option<String> = self.client.get(key).await.unwrap();

        match cached_value {
            Some(value) => {
                let result: T = serde_json::from_str(&value).unwrap();

                result
            }
            None => {
                let result = fn_compute().await;

                let serialized = serde_json::to_string(&result).unwrap();
                self.client
                    .set_with_options(
                        key,
                        serialized,
                        SetCondition::None,
                        SetExpiration::Ex(ttl),
                        false,
                    )
                    .await
                    .unwrap();

                result
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
