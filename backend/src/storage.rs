use std::{path::Path, sync::Arc};

use tokio::sync::RwLockReadGuard;

fn get_s3_client(
    access_key: &str,
    secret_key: &str,
    bucket: &str,
    region: &str,
    endpoint: &str,
    path_style: bool,
) -> Result<Box<s3::Bucket>, anyhow::Error> {
    let mut bucket = s3::Bucket::new(
        bucket,
        s3::Region::Custom {
            region: region.to_string(),
            endpoint: endpoint.to_string(),
        },
        s3::creds::Credentials::new(Some(access_key), Some(secret_key), None, None, None)?,
    )?;

    if path_style {
        bucket.set_path_style();
    }

    Ok(bucket)
}

pub struct StorageUrlRetriever<'a> {
    settings: RwLockReadGuard<'a, crate::settings::AppSettings>,
}

impl<'a> StorageUrlRetriever<'a> {
    pub fn new(settings: RwLockReadGuard<'a, crate::settings::AppSettings>) -> Self {
        Self { settings }
    }

    pub fn get_url(&self, path: &str) -> String {
        match &self.settings.storage_driver {
            crate::settings::StorageDriver::Filesystem { .. } => {
                format!("{}/{}", self.settings.app.url.trim_end_matches('/'), path)
            }
            crate::settings::StorageDriver::S3 { public_url, .. } => {
                format!("{}/{}", public_url.trim_end_matches('/'), path)
            }
        }
    }
}

pub struct Storage {
    settings: Arc<crate::settings::Settings>,
}

impl Storage {
    pub fn new(settings: Arc<crate::settings::Settings>) -> Self {
        Self { settings }
    }

    pub async fn retrieve_urls(&self) -> StorageUrlRetriever<'_> {
        let settings = self.settings.get().await;

        StorageUrlRetriever::new(settings)
    }

    pub async fn remove(&self, path: &str) -> Result<(), anyhow::Error> {
        if path.is_empty() {
            return Ok(());
        }

        let settings = self.settings.get().await;

        tracing::debug!(path, "removing file");

        match &settings.storage_driver {
            crate::settings::StorageDriver::Filesystem { path: base_path } => {
                if let Err(err) = tokio::fs::remove_dir_all(Path::new(base_path).join(path)).await
                    && err.kind() != std::io::ErrorKind::NotFound
                {
                    return Err(err.into());
                }
            }
            crate::settings::StorageDriver::S3 {
                access_key,
                secret_key,
                bucket,
                region,
                endpoint,
                path_style,
                ..
            } => {
                let s3_client = get_s3_client(
                    access_key,
                    secret_key,
                    bucket,
                    region,
                    endpoint,
                    *path_style,
                )?;

                s3_client.delete_object(path).await?;
            }
        }

        Ok(())
    }

    pub async fn store(
        &self,
        path: &str,
        data: &[u8],
        content_type: &str,
    ) -> Result<(), anyhow::Error> {
        let settings = self.settings.get().await;

        tracing::debug!(path, "storing file: {} bytes", data.len());

        match &settings.storage_driver {
            crate::settings::StorageDriver::Filesystem { path: base_path } => {
                let full_path = Path::new(base_path).join(path);
                if let Some(parent) = full_path.parent() {
                    tokio::fs::create_dir_all(parent).await?;
                }

                tokio::fs::write(full_path, data).await?;
            }
            crate::settings::StorageDriver::S3 {
                access_key,
                secret_key,
                bucket,
                region,
                endpoint,
                path_style,
                ..
            } => {
                let s3_client = get_s3_client(
                    access_key,
                    secret_key,
                    bucket,
                    region,
                    endpoint,
                    *path_style,
                )?;

                s3_client
                    .put_object_with_content_type(path, data, content_type)
                    .await?;
            }
        }

        Ok(())
    }
}
