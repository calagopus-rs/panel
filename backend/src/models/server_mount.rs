use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerMount {
    pub mount: super::mount::Mount,

    pub created: Option<chrono::NaiveDateTime>,
}

impl BaseModel for ServerMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_mounts");

        let mut columns =
            BTreeMap::from([(format!("{table}.created"), format!("{prefix}created"))]);

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

impl ServerMount {
    pub async fn create(
        database: &crate::database::Database,
        server_id: i32,
        mount_id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO server_mounts (server_id, mount_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(server_id)
        .bind(mount_id)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_server_id_mount_id(
        database: &crate::database::Database,
        server_id: i32,
        mount_id: i32,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_mounts
            JOIN mounts ON mounts.id = server_mounts.mount_id
            WHERE server_mounts.server_id = $1 AND server_mounts.mount_id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
        .bind(mount_id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> crate::models::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_mounts
            JOIN mounts ON mounts.id = server_mounts.mount_id
            WHERE server_mounts.server_id = $1
            ORDER BY server_mounts.mount_id ASC
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

    pub async fn mountable_by_server_id_with_pagination(
        database: &crate::database::Database,
        server: &super::server::Server,
        page: i64,
        per_page: i64,
    ) -> crate::models::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM mounts
            JOIN node_mounts ON mounts.id = node_mounts.mount_id AND node_mounts.node_id = $1
            JOIN nest_egg_mounts ON mounts.id = nest_egg_mounts.mount_id AND nest_egg_mounts.egg_id = $2
            LEFT JOIN server_mounts ON server_mounts.mount_id = mounts.id AND server_mounts.server_id = $3
            WHERE mounts.user_mountable = TRUE
            ORDER BY mounts.id ASC
            LIMIT $4 OFFSET $5
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server.node.id)
        .bind(server.egg.id)
        .bind(server.id)
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

    pub async fn delete_by_ids(
        database: &crate::database::Database,
        server_id: i32,
        mount_id: i32,
    ) {
        sqlx::query(
            r#"
            DELETE FROM server_mounts
            WHERE
                server_mounts.server_id = $1
                AND server_mounts.mount_id = $2
            "#,
        )
        .bind(server_id)
        .bind(mount_id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerMount {
        ApiServerMount {
            id: self.mount.id,
            name: self.mount.name,
            description: self.mount.description,
            target: self.mount.target,
            read_only: self.mount.read_only,
            created: self.created.map(|dt| dt.and_utc()),
        }
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiServerMount {
        AdminApiServerMount {
            mount: self.mount.into_admin_api_object(),
            created: self.created.map(|dt| dt.and_utc()),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerMount")]
pub struct ApiServerMount {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub target: String,
    pub read_only: bool,

    pub created: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminServerMount")]
pub struct AdminApiServerMount {
    pub mount: super::mount::AdminApiMount,

    pub created: Option<chrono::DateTime<chrono::Utc>>,
}
