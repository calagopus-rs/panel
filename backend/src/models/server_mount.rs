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
        server_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO server_mounts (server_uuid, mount_uuid)
            VALUES ($1, $2)
            "#,
        )
        .bind(server_uuid)
        .bind(mount_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_server_uuid_mount_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_mounts
            JOIN mounts ON mounts.uuid = server_mounts.mount_uuid
            WHERE server_mounts.server_uuid = $1 AND server_mounts.mount_uuid = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_uuid)
        .bind(mount_uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_mounts
            JOIN mounts ON mounts.uuid = server_mounts.mount_uuid
            WHERE server_mounts.server_uuid = $1
            ORDER BY server_mounts.mount_uuid ASC
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_uuid)
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

    pub async fn mountable_by_server_with_pagination(
        database: &crate::database::Database,
        server: &super::server::Server,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM mounts
            JOIN node_mounts ON mounts.uuid = node_mounts.mount_uuid AND node_mounts.node_uuid = $1
            JOIN nest_egg_mounts ON mounts.uuid = nest_egg_mounts.mount_uuid AND nest_egg_mounts.egg_uuid = $2
            LEFT JOIN server_mounts ON server_mounts.mount_uuid = mounts.uuid AND server_mounts.server_uuid = $3
            WHERE mounts.user_mountable = TRUE AND ($4 IS NULL OR mounts.name ILIKE '%' || $4 || '%')
            ORDER BY mounts.created
            LIMIT $5 OFFSET $6
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server.node.uuid)
        .bind(server.egg.uuid)
        .bind(server.uuid)
        .bind(search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        ?;

        Ok(super::Pagination {
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM server_mounts
            WHERE server_mounts.server_uuid = $1 AND server_mounts.mount_uuid = $2
            "#,
        )
        .bind(server_uuid)
        .bind(mount_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerMount {
        ApiServerMount {
            uuid: self.mount.uuid,
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
    pub uuid: uuid::Uuid,

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
