use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NestEggMount {
    pub mount: super::mount::Mount,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEggMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("nest_egg_mounts");

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

impl NestEggMount {
    pub async fn create(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO nest_egg_mounts (egg_uuid, mount_uuid)
            VALUES ($1, $2)
            "#,
        )
        .bind(egg_uuid)
        .bind(mount_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_egg_uuid_mount_uuid(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_mounts
            JOIN mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE nest_egg_mounts.egg_uuid = $1 AND nest_egg_mounts.mount_uuid = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_uuid)
        .bind(mount_uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_egg_uuid_with_pagination(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_egg_mounts
            JOIN mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE nest_egg_mounts.egg_uuid = $1 AND ($2 IS NULL OR mounts.name ILIKE '%' || $2 || '%')
            ORDER BY nest_egg_mounts.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_uuid)
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

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM nest_egg_mounts
            WHERE nest_egg_mounts.egg_uuid = $1 AND nest_egg_mounts.mount_uuid = $2
            "#,
        )
        .bind(egg_uuid)
        .bind(mount_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEggMount {
        AdminApiNestEggMount {
            mount: self.mount.into_admin_api_object(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEggMount")]
pub struct AdminApiNestEggMount {
    pub mount: super::mount::AdminApiMount,

    pub created: chrono::DateTime<chrono::Utc>,
}
