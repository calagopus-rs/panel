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
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_backups");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.name"), format!("{prefix}name")),
            (format!("{table}.successful"), format!("{prefix}successful")),
            (format!("{table}.locked"), format!("{prefix}locked")),
            (
                format!("{table}.ignored_files"),
                format!("{prefix}ignored_files"),
            ),
            (format!("{table}.checksum"), format!("{prefix}checksum")),
            (format!("{table}.bytes"), format!("{prefix}bytes")),
            (format!("{table}.disk"), format!("{prefix}disk")),
            (format!("{table}.completed"), format!("{prefix}completed")),
            (format!("{table}.deleted"), format!("{prefix}deleted")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            successful: row.get(format!("{prefix}successful").as_str()),
            locked: row.get(format!("{prefix}locked").as_str()),
            ignored_files: row.get(format!("{prefix}ignored_files").as_str()),
            checksum: row.get(format!("{prefix}checksum").as_str()),
            bytes: row.get(format!("{prefix}bytes").as_str()),
            disk: row.get(format!("{prefix}disk").as_str()),
            completed: row.get(format!("{prefix}completed_at").as_str()),
            deleted: row.get(format!("{prefix}deleted_at").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
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
