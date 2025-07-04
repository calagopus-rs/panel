use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerBackup {
    pub id: i32,
    pub uuid: uuid::Uuid,

    pub name: String,
    pub successful: bool,
    pub locked: bool,

    pub ignored_files: Vec<String>,
    pub checksum: String,
    pub bytes: i64,
    pub disk: String,

    pub completed: Option<chrono::NaiveDateTime>,
    pub deleted: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerBackup {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("server_backups");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.uuid", table),
                format!("{}uuid", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.name", table),
                format!("{}name", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.successful", table),
                format!("{}successful", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.locked", table),
                format!("{}locked", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.ignored_files", table),
                format!("{}ignored_files", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.checksum", table),
                format!("{}checksum", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.bytes", table),
                format!("{}bytes", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.disk", table),
                format!("{}disk", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.completed", table),
                format!("{}completed", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.deleted", table),
                format!("{}deleted", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            uuid: row.get(format!("{}uuid", prefix).as_str()),
            name: row.get(format!("{}name", prefix).as_str()),
            successful: row.get(format!("{}successful", prefix).as_str()),
            locked: row.get(format!("{}locked", prefix).as_str()),
            ignored_files: row.get(format!("{}ignored_files", prefix).as_str()),
            checksum: row.get(format!("{}checksum", prefix).as_str()),
            bytes: row.get(format!("{}bytes", prefix).as_str()),
            disk: row.get(format!("{}disk", prefix).as_str()),
            completed: row.get(format!("{}completed_at", prefix).as_str()),
            deleted: row.get(format!("{}deleted_at", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl ServerBackup {
    pub async fn new(
        database: &crate::database::Database,
        server_id: i32,
        name: &str,
        ignored_files: &[String],
        disk: &str,
    ) -> bool {
        sqlx::query(
            r#"
            INSERT INTO server_backups (server_id, name, ignored_files, checksum, bytes, disk) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(server_id)
        .bind(name)
        .bind(ignored_files)
        .bind("")
        .bind(0)
        .bind(disk)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn by_uuid(database: &crate::database::Database, uuid: uuid::Uuid) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.uuid = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn all_by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_backups
            WHERE server_backups.server_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
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

    #[inline]
    pub fn into_api_object(self) -> ApiServerBackup {
        ApiServerBackup {
            uuid: self.uuid,
            name: self.name,
            ignored_files: self.ignored_files,
            successful: self.successful,
            locked: self.locked,
            checksum: self.checksum,
            bytes: self.bytes,
            completed: self.completed.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerBackup")]
pub struct ApiServerBackup {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub ignored_files: Vec<String>,

    pub successful: bool,
    pub locked: bool,
    pub checksum: String,
    pub bytes: i64,

    pub completed: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
