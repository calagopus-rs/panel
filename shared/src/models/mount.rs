use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct Mount {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub source: String,
    pub target: String,

    pub read_only: bool,
    pub user_mountable: bool,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Mount {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("mounts.uuid", format!("{prefix}uuid")),
            ("mounts.name", format!("{prefix}name")),
            ("mounts.description", format!("{prefix}description")),
            ("mounts.source", format!("{prefix}source")),
            ("mounts.target", format!("{prefix}target")),
            ("mounts.read_only", format!("{prefix}read_only")),
            ("mounts.user_mountable", format!("{prefix}user_mountable")),
            ("mounts.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            source: row.get(format!("{prefix}source").as_str()),
            target: row.get(format!("{prefix}target").as_str()),
            read_only: row.get(format!("{prefix}read_only").as_str()),
            user_mountable: row.get(format!("{prefix}user_mountable").as_str()),
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
            Self::columns_sql(None)
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

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            WHERE mounts.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_node_uuid_egg_uuid_uuid(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        egg_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            JOIN node_mounts ON mounts.uuid = node_mounts.mount_uuid
            JOIN nest_egg_mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE node_mounts.node_uuid = $1 AND nest_egg_mounts.egg_uuid = $2 AND mounts.uuid = $3
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
        .bind(egg_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM mounts
            WHERE ($1 IS NULL OR mounts.name ILIKE '%' || $1 || '%')
            ORDER BY mounts.created
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM mounts
            WHERE mounts.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiMount {
        AdminApiMount {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            source: self.source,
            target: self.target,
            read_only: self.read_only,
            user_mountable: self.user_mountable,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Mount")]
pub struct AdminApiMount {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub source: String,
    pub target: String,

    pub read_only: bool,
    pub user_mountable: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
