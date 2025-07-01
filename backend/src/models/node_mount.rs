use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NodeMount {
    pub mount: super::mount::Mount,

    pub created: NaiveDateTime,
}

impl BaseModel for NodeMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("node_mounts");

        let mut columns = BTreeMap::from([
            (
                format!("{}.mount_id", table),
                format!("{}mount_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ]);

        columns.extend(super::mount::Mount::columns(Some("mount_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            mount: super::mount::Mount::map(Some("mount_"), row),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl NodeMount {
    pub async fn new(database: &crate::database::Database, node_id: i32, mount_id: i32) -> bool {
        sqlx::query(&format!(
            r#"
            INSERT INTO node_mounts (node_id, mount_id)
            VALUES ($1, $2)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(node_id)
        .bind(mount_id)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn all_by_node_id(database: &crate::database::Database, node_id: i32) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM node_mounts
            JOIN mounts ON mounts.id = node_mounts.mount_id
            WHERE node_mounts.node_id = $1
            "#,
            Self::columns_sql(None, None),
            super::mount::Mount::columns_sql(Some("mount_"), None)
        ))
        .bind(node_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    pub async fn delete_by_ids(database: &crate::database::Database, node_id: i32, ids: &[i32]) {
        sqlx::query(
            r#"
            DELETE FROM node_mounts
            WHERE
                node_mounts.node_id = $1
                AND node_mounts.mount_id = ANY($2)
            "#,
        )
        .bind(node_id)
        .bind(ids)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNodeMount {
        AdminApiNodeMount {
            mount: self.mount.into_admin_api_object(),
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NodeMount")]
pub struct AdminApiNodeMount {
    pub mount: super::mount::AdminApiMount,

    pub created: NaiveDateTime,
}
