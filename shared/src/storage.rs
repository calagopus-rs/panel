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
    settings: RwLockReadGuard<'a, super::settings::AppSettings>,
}

impl<'a> StorageUrlRetriever<'a> {
    pub fn new(settings: RwLockReadGuard<'a, super::settings::AppSettings>) -> Self {
        Self { settings }
    }

    pub fn get_settings(&self) -> &super::settings::AppSettings {
        &self.settings
    }

    pub fn get_url(&self, path: &str) -> String {
        match &self.settings.storage_driver {
            super::settings::StorageDriver::Filesystem { .. } => {
                format!("{}/{}", self.settings.app.url.trim_end_matches('/'), path)
            }
            super::settings::StorageDriver::S3 { public_url, .. } => {
                format!("{}/{}", public_url.trim_end_matches('/'), path)
            }
        }
    }
}

pub struct Storage {
    settings: Arc<super::settings::Settings>,
}

impl Storage {
    pub fn new(settings: Arc<super::settings::Settings>) -> Self {
        Self { settings }
    }

    pub async fn retrieve_urls(&self) -> StorageUrlRetriever<'_> {
        let settings = self.settings.get().await;

        StorageUrlRetriever::new(settings)
    }

    pub async fn remove(&self, path: Option<&str>) -> Result<(), anyhow::Error> {
        let path = match path {
            Some(path) => path,
            None => return Ok(()),
        };

        if path.is_empty() || path.contains("..") || path.starts_with("/") {
            return Err(anyhow::anyhow!("invalid path"));
        }

        let settings = self.settings.get().await;

        tracing::debug!(path, "removing file");

        match &settings.storage_driver {
            super::settings::StorageDriver::Filesystem { path: base_path } => {
                let base_filesystem =
                    crate::cap::CapFilesystem::async_new(base_path.into()).await?;

                if let Err(err) = base_filesystem.async_remove_file(&path).await
                    && err
                        .downcast_ref::<std::io::Error>()
                        .is_none_or(|e| e.kind() != std::io::ErrorKind::NotFound)
                {
                    return Err(err);
                }

                if let Some(parent) = Path::new(path).parent().map(|p| p.to_path_buf()) {
                    tokio::spawn(async move {
                        tokio::time::sleep(std::time::Duration::from_secs(10)).await;

                        let mut directory = match base_filesystem.async_read_dir(&parent).await {
                            Ok(directory) => directory,
                            Err(_) => return,
                        };

                        if directory.next_entry().await.is_none() {
                            base_filesystem.async_remove_dir(parent).await.ok();
                        }
                    });
                }
            }
            super::settings::StorageDriver::S3 {
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
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<(), anyhow::Error> {
        if path.is_empty() || path.contains("..") || path.starts_with("/") {
            return Err(anyhow::anyhow!("invalid path"));
        }

        let settings = self.settings.get().await;

        tracing::debug!(path, "storing file: {} bytes", data.len());

        match &settings.storage_driver {
            super::settings::StorageDriver::Filesystem { path: base_path } => {
                let base_filesystem =
                    crate::cap::CapFilesystem::async_new(base_path.into()).await?;

                if let Some(parent) = Path::new(path).parent() {
                    base_filesystem.async_create_dir_all(parent).await?;
                }

                base_filesystem.async_write(path, data).await?;
            }
            super::settings::StorageDriver::S3 {
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
                    .put_object_with_content_type(path, &data, content_type)
                    .await?;
            }
        }

        Ok(())
    }
}
