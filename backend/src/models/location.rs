use super::BaseModel;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct LocationBackupConfigsS3 {
    pub access_key: String,
    pub secret_key: String,
    pub bucket: String,
    pub region: String,
    pub endpoint: String,
    pub path_style: bool,
    pub part_size: u64,
}

impl LocationBackupConfigsS3 {
    pub fn encrypt(&mut self, database: &crate::database::Database) {
        self.secret_key = base32::encode(
            base32::Alphabet::Z,
            &database.encrypt(self.secret_key.as_bytes()).unwrap(),
        );
    }

    pub fn decrypt(&mut self, database: &crate::database::Database) {
        self.secret_key = database
            .decrypt(base32::decode(base32::Alphabet::Z, &self.secret_key).unwrap())
            .unwrap();
    }

    pub fn censor(&mut self) {
        self.secret_key = "".into();
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
pub struct LocationBackupConfigsRestic {
    pub repository: String,
    pub retry_lock_seconds: u64,

    pub environment: IndexMap<String, String>,
}

impl LocationBackupConfigsRestic {
    pub fn encrypt(&mut self, database: &crate::database::Database) {
        for value in self.environment.values_mut() {
            *value = base32::encode(
                base32::Alphabet::Z,
                &database.encrypt(value.as_bytes()).unwrap(),
            );
        }
    }

    pub fn decrypt(&mut self, database: &crate::database::Database) {
        for value in self.environment.values_mut() {
            *value = database
                .decrypt(base32::decode(base32::Alphabet::Z, value).unwrap())
                .unwrap();
        }
    }

    pub fn censor(&mut self) {
        for (key, value) in self.environment.iter_mut() {
            if key == "RESTIC_PASSWORD" || key == "AWS_SECRET_ACCESS_KEY" {
                *value = "".into();
            }
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize, Default, Clone)]
pub struct LocationBackupConfigs {
    #[serde(default)]
    #[schema(inline)]
    pub s3: Option<LocationBackupConfigsS3>,
    #[serde(default)]
    #[schema(inline)]
    pub restic: Option<LocationBackupConfigsRestic>,
}

impl LocationBackupConfigs {
    pub fn encrypt(&mut self, database: &crate::database::Database) {
        if let Some(s3) = &mut self.s3 {
            s3.encrypt(database);
        }
        if let Some(restic) = &mut self.restic {
            restic.encrypt(database);
        }
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
pub struct Location {
    pub id: i32,

    pub short_name: String,
    pub name: String,
    pub description: Option<String>,

    pub backup_disk: super::server_backup::BackupDisk,
    pub backup_configs: LocationBackupConfigs,

    pub nodes: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Location {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("locations");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.short_name"), format!("{prefix}short_name")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (
                format!("{table}.backup_disk"),
                format!("{prefix}backup_disk"),
            ),
            (
                format!("{table}.backup_configs"),
                format!("{prefix}backup_configs"),
            ),
            (
                format!("(SELECT COUNT(*) FROM nodes WHERE nodes.location_id = {table}.id)"),
                format!("{prefix}nodes"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            short_name: row.get(format!("{prefix}short_name").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            backup_disk: row.get(format!("{prefix}backup_disk").as_str()),
            backup_configs: serde_json::from_value(
                row.get(format!("{prefix}backup_configs").as_str()),
            )
            .unwrap_or_default(),
            nodes: row.get(format!("{prefix}nodes").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Location {
    pub async fn create(
        database: &crate::database::Database,
        short_name: &str,
        name: &str,
        description: Option<&str>,
        backup_disk: super::server_backup::BackupDisk,
        mut backup_configs: LocationBackupConfigs,
    ) -> Result<Self, sqlx::Error> {
        backup_configs.encrypt(database);

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO locations (short_name, name, description, backup_disk, backup_configs)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(short_name)
        .bind(name)
        .bind(description)
        .bind(backup_disk)
        .bind(serde_json::to_value(backup_configs).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM locations
            WHERE locations.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM locations
            ORDER BY locations.id ASC
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        .unwrap();

        super::Pagination {
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        }
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM locations
            WHERE locations.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(mut self) -> AdminApiLocation {
        self.backup_configs.censor();

        AdminApiLocation {
            id: self.id,
            short_name: self.short_name,
            name: self.name,
            description: self.description,
            backup_disk: self.backup_disk,
            backup_configs: self.backup_configs,
            nodes: self.nodes,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Location")]
pub struct AdminApiLocation {
    pub id: i32,

    pub short_name: String,
    pub name: String,
    pub description: Option<String>,

    pub backup_disk: super::server_backup::BackupDisk,
    pub backup_configs: LocationBackupConfigs,

    pub nodes: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
