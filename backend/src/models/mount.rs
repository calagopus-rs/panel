use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct Mount {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub source: String,
    pub target: String,

    pub read_only: bool,
    pub user_mountable: bool,

    pub eggs: i64,
    pub nodes: i64,
    pub servers: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Mount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("mounts");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (format!("{table}.source"), format!("{prefix}source")),
            (format!("{table}.target"), format!("{prefix}target")),
            (format!("{table}.read_only"), format!("{prefix}read_only")),
            (
                format!("{table}.user_mountable"),
                format!("{prefix}user_mountable"),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM nest_egg_mounts WHERE nest_egg_mounts.mount_id = {table}.id)"
                ),
                format!("{prefix}eggs"),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM node_mounts WHERE node_mounts.mount_id = {table}.id)"
                ),
                format!("{prefix}nodes"),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM server_mounts WHERE server_mounts.mount_id = {table}.id)"
                ),
                format!("{prefix}servers"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            source: row.get(format!("{prefix}source").as_str()),
            target: row.get(format!("{prefix}target").as_str()),
            read_only: row.get(format!("{prefix}read_only").as_str()),
            user_mountable: row.get(format!("{prefix}user_mountable").as_str()),
            eggs: row.get(format!("{prefix}eggs").as_str()),
            nodes: row.get(format!("{prefix}nodes").as_str()),
            servers: row.get(format!("{prefix}servers").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Mount {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        source: &str,
        target: &str,
        read_only: bool,
        user_mountable: bool,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO mounts (name, description, source, target, read_only, user_mountable)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(name)
        .bind(description)
        .bind(source)
        .bind(target)
        .bind(read_only)
        .bind(user_mountable)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            WHERE mounts.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_node_id_egg_id_id(
        database: &crate::database::Database,
        node_id: i32,
        egg_id: i32,
        id: i32,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            JOIN node_mounts ON mounts.id = node_mounts.mount_id
            JOIN nest_egg_mounts ON mounts.id = nest_egg_mounts.mount_id
            WHERE node_mounts.node_id = $1 AND nest_egg_mounts.egg_id = $2 AND mounts.id = $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(node_id)
        .bind(egg_id)
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
    ) -> crate::models::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM mounts
            ORDER BY mounts.id ASC
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None)
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
            DELETE FROM mounts
            WHERE mounts.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiMount {
        AdminApiMount {
            id: self.id,
            name: self.name,
            description: self.description,
            source: self.source,
            target: self.target,
            read_only: self.read_only,
            user_mountable: self.user_mountable,
            eggs: self.eggs,
            nodes: self.nodes,
            servers: self.servers,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Mount")]
pub struct AdminApiMount {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub source: String,
    pub target: String,

    pub read_only: bool,
    pub user_mountable: bool,

    pub eggs: i64,
    pub nodes: i64,
    pub servers: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
