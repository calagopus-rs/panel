use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NodeMount {
    pub mount: super::mount::Mount,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NodeMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("node_mounts");

        let mut columns = BTreeMap::from([
            (format!("{table}.mount_id"), format!("{prefix}mount_id")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::mount::Mount::columns(Some("mount_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            mount: super::mount::Mount::map(Some("mount_"), row),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl NodeMount {
    pub async fn create(
        database: &crate::database::Database,
        node_id: i32,
        mount_id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO node_mounts (node_id, mount_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(node_id)
        .bind(mount_id)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_node_id_mount_id(
        database: &crate::database::Database,
        node_id: i32,
        mount_id: i32,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM node_mounts
            JOIN mounts ON mounts.id = node_mounts.mount_id
            WHERE node_mounts.node_id = $1 AND node_mounts.mount_id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(node_id)
        .bind(mount_id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_node_id_with_pagination(
        database: &crate::database::Database,
        node_id: i32,
        page: i64,
        per_page: i64,
    ) -> crate::models::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM node_mounts
            JOIN mounts ON mounts.id = node_mounts.mount_id
            WHERE node_mounts.node_id = $1
            ORDER BY node_mounts.mount_id ASC
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(node_id)
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

    pub async fn delete_by_ids(database: &crate::database::Database, node_id: i32, mount_id: i32) {
        sqlx::query(
            r#"
            DELETE FROM node_mounts
            WHERE
                node_mounts.node_id = $1
                AND node_mounts.mount_id = $2
            "#,
        )
        .bind(node_id)
        .bind(mount_id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNodeMount {
        AdminApiNodeMount {
            mount: self.mount.into_admin_api_object(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NodeMount")]
pub struct AdminApiNodeMount {
    pub mount: super::mount::AdminApiMount,

    pub created: chrono::DateTime<chrono::Utc>,
}
