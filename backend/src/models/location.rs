use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum LocationConfigBackups {
    Local,
    S3 {
        access_key: String,
        secret_key: String,
        bucket: String,
        region: String,
        endpoint: String,
        path_style: bool,
        part_size: u64,
    },
    #[serde(rename = "ddup-bak")]
    DdupBak,
    Btrfs,
    Zfs,
    Restic,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Location {
    pub id: i32,

    pub short_name: String,
    pub name: String,
    pub description: Option<String>,

    pub config_backups: LocationConfigBackups,

    pub nodes: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Location {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("locations");

        BTreeMap::from([
            (format!("{}.id", table), format!("{}id", prefix)),
            (
                format!("{}.short_name", table),
                format!("{}short_name", prefix),
            ),
            (format!("{}.name", table), format!("{}name", prefix)),
            (
                format!("{}.description", table),
                format!("{}description", prefix),
            ),
            (
                format!("{}.config_backups", table),
                format!("{}config_backups", prefix),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM nodes WHERE nodes.location_id = {}.id)",
                    table
                ),
                format!("{}nodes", prefix),
            ),
            (format!("{}.created", table), format!("{}created", prefix)),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            short_name: row.get(format!("{}short_name", prefix).as_str()),
            name: row.get(format!("{}name", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            config_backups: serde_json::from_value(
                row.get(format!("{}config_backups", prefix).as_str()),
            )
            .unwrap_or(LocationConfigBackups::Local),
            nodes: row.get(format!("{}nodes", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl Location {
    pub async fn create(
        database: &crate::database::Database,
        short_name: &str,
        name: &str,
        description: Option<&str>,
        mut config_backups: LocationConfigBackups,
    ) -> Result<Self, sqlx::Error> {
        match &mut config_backups {
            LocationConfigBackups::S3 { secret_key, .. } => {
                *secret_key = base32::encode(
                    base32::Alphabet::Z,
                    &database.encrypt(secret_key.as_bytes()).unwrap(),
                );
            }
            _ => {}
        }

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO locations (short_name, name, description, config_backups)
            VALUES ($1, $2, $3, $4)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(short_name)
        .bind(name)
        .bind(description)
        .bind(serde_json::to_value(config_backups).unwrap())
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
    pub fn into_decrypted_backups(
        self,
        database: &crate::database::Database,
    ) -> LocationConfigBackups {
        match self.config_backups {
            LocationConfigBackups::S3 {
                access_key,
                secret_key,
                bucket,
                region,
                endpoint,
                path_style,
                part_size,
            } => LocationConfigBackups::S3 {
                access_key,
                secret_key: base32::decode(base32::Alphabet::Z, &secret_key)
                    .map(|b| database.decrypt(&b).unwrap_or_default())
                    .unwrap_or_default(),
                bucket,
                region,
                endpoint,
                path_style,
                part_size,
            },
            _ => self.config_backups.clone(),
        }
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiLocation {
        AdminApiLocation {
            id: self.id,
            short_name: self.short_name,
            name: self.name,
            description: self.description,
            backups: match self.config_backups {
                LocationConfigBackups::S3 {
                    access_key,
                    bucket,
                    region,
                    endpoint,
                    path_style,
                    part_size,
                    ..
                } => LocationConfigBackups::S3 {
                    access_key,
                    secret_key: "".to_string(),
                    bucket,
                    region,
                    endpoint,
                    path_style,
                    part_size,
                },
                backups => backups,
            },
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

    pub backups: LocationConfigBackups,

    pub nodes: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
