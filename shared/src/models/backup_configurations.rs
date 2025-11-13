use crate::prelude::*;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct BackupConfigsS3 {
    pub access_key: String,
    pub secret_key: String,
    pub bucket: String,
    pub region: String,
    pub endpoint: String,
    pub path_style: bool,
    pub part_size: u64,
}

impl BackupConfigsS3 {
    pub async fn encrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        self.secret_key = base32::encode(
            base32::Alphabet::Z,
            &database.encrypt(self.secret_key.clone()).await?,
        );

        Ok(())
    }

    pub async fn decrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        self.secret_key = database
            .decrypt(base32::decode(base32::Alphabet::Z, &self.secret_key).unwrap())
            .await?;

        Ok(())
    }

    pub fn censor(&mut self) {
        self.secret_key = "".to_string();
    }

    pub fn into_client(self) -> Result<Box<s3::Bucket>, s3::error::S3Error> {
        let mut bucket = s3::Bucket::new(
            &self.bucket,
            s3::Region::Custom {
                region: self.region,
                endpoint: self.endpoint,
            },
            s3::creds::Credentials::new(
                Some(&self.access_key),
                Some(&self.secret_key),
                None,
                None,
                None,
            )
            .unwrap(),
        )?;

        if self.path_style {
            bucket.set_path_style();
        }

        Ok(bucket)
    }
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct BackupConfigsRestic {
    pub repository: String,
    pub retry_lock_seconds: u64,

    pub environment: IndexMap<String, String>,
}

impl BackupConfigsRestic {
    pub async fn encrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        for value in self.environment.values_mut() {
            *value = base32::encode(base32::Alphabet::Z, &database.encrypt(value.clone()).await?);
        }

        Ok(())
    }

    pub async fn decrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        for value in self.environment.values_mut() {
            *value = database
                .decrypt(base32::decode(base32::Alphabet::Z, value).unwrap())
                .await?;
        }

        Ok(())
    }

    pub fn censor(&mut self) {
        for (key, value) in self.environment.iter_mut() {
            if key == "RESTIC_PASSWORD" || key == "AWS_SECRET_ACCESS_KEY" {
                *value = "".to_string();
            }
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize, Default, Clone)]
pub struct BackupConfigs {
    #[serde(default)]
    #[schema(inline)]
    pub s3: Option<BackupConfigsS3>,
    #[serde(default)]
    #[schema(inline)]
    pub restic: Option<BackupConfigsRestic>,
}

impl BackupConfigs {
    pub async fn encrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        if let Some(s3) = &mut self.s3 {
            s3.encrypt(database).await?;
        }
        if let Some(restic) = &mut self.restic {
            restic.encrypt(database).await?;
        }

        Ok(())
    }

    pub async fn decrypt(
        &mut self,
        database: &crate::database::Database,
    ) -> Result<(), anyhow::Error> {
        if let Some(s3) = &mut self.s3 {
            s3.decrypt(database).await?;
        }
        if let Some(restic) = &mut self.restic {
            restic.decrypt(database).await?;
        }

        Ok(())
    }

    pub fn censor(&mut self) {
        if let Some(s3) = &mut self.s3 {
            s3.censor();
        }
        if let Some(restic) = &mut self.restic {
            restic.censor();
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct BackupConfiguration {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub backup_disk: super::server_backup::BackupDisk,
    pub backup_configs: BackupConfigs,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for BackupConfiguration {
    const NAME: &'static str = "backup_configuration";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("backup_configurations.uuid", format!("{prefix}uuid")),
            ("backup_configurations.name", format!("{prefix}name")),
            (
                "backup_configurations.description",
                format!("{prefix}description"),
            ),
            (
                "backup_configurations.backup_disk",
                format!("{prefix}backup_disk"),
            ),
            (
                "backup_configurations.backup_configs",
                format!("{prefix}backup_configs"),
            ),
            ("backup_configurations.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(format!("{prefix}uuid").as_str())?,
            name: row.try_get(format!("{prefix}name").as_str())?,
            description: row.try_get(format!("{prefix}description").as_str())?,
            backup_disk: row.try_get(format!("{prefix}backup_disk").as_str())?,
            backup_configs: serde_json::from_value(
                row.get(format!("{prefix}backup_configs").as_str()),
            )
            .unwrap_or_default(),
            created: row.try_get(format!("{prefix}created").as_str())?,
        })
    }
}

impl BackupConfiguration {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        backup_disk: super::server_backup::BackupDisk,
        mut backup_configs: BackupConfigs,
    ) -> Result<Self, crate::database::DatabaseError> {
        backup_configs.encrypt(database).await?;

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO backup_configurations (name, description, backup_disk, backup_configs)
            VALUES ($1, $2, $3, $4)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(name)
        .bind(description)
        .bind(backup_disk)
        .bind(serde_json::to_value(backup_configs)?)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM backup_configurations
            WHERE $1 IS NULL OR backup_configurations.name ILIKE '%' || $1 || '%'
            ORDER BY backup_configurations.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None)
        ))
        .bind(search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await?;

        Ok(super::Pagination {
            total: rows
                .first()
                .map_or(Ok(0), |row| row.try_get("total_count"))?,
            per_page,
            page,
            data: rows
                .into_iter()
                .map(|row| Self::map(None, &row))
                .try_collect_vec()?,
        })
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            DELETE FROM backup_configurations
            WHERE backup_configurations.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub async fn into_admin_api_object(
        mut self,
        database: &crate::database::Database,
    ) -> Result<AdminApiBackupConfiguration, crate::database::DatabaseError> {
        self.backup_configs.decrypt(database).await?;

        Ok(AdminApiBackupConfiguration {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            backup_disk: self.backup_disk,
            backup_configs: self.backup_configs,
            created: self.created.and_utc(),
        })
    }
}

#[async_trait::async_trait]
impl ByUuid for BackupConfiguration {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM backup_configurations
            WHERE backup_configurations.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "BackupConfiguration")]
pub struct AdminApiBackupConfiguration {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub backup_disk: super::server_backup::BackupDisk,
    pub backup_configs: BackupConfigs,

    pub created: chrono::DateTime<chrono::Utc>,
}
