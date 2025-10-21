use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct LocationDatabaseHost {
    pub location_uuid: uuid::Uuid,
    pub database_host: super::database_host::DatabaseHost,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for LocationDatabaseHost {
    const NAME: &'static str = "location_database_host";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            (
                "location_database_hosts.location_uuid",
                format!("{prefix}location_uuid"),
            ),
            (
                "location_database_hosts.created",
                format!("{prefix}created"),
            ),
        ]);

        columns.extend(super::database_host::DatabaseHost::columns(Some(
            "database_host_",
        )));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            location_uuid: row.get(format!("{prefix}location_uuid").as_str()),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl LocationDatabaseHost {
    pub async fn create(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        database_host_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO location_database_hosts (location_uuid, database_host_uuid)
            VALUES ($1, $2)
            "#,
        )
        .bind(location_uuid)
        .bind(database_host_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_location_uuid_database_host_uuid(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        database_host_uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_uuid = database_hosts.uuid
            WHERE location_database_hosts.location_uuid = $1 AND location_database_hosts.database_host_uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(location_uuid)
        .bind(database_host_uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_location_uuid_with_pagination(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_uuid = database_hosts.uuid
            WHERE location_database_hosts.location_uuid = $1 AND ($2 IS NULL OR database_hosts.name ILIKE '%' || $2 || '%')
            ORDER BY location_database_hosts.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(location_uuid)
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

    pub async fn all_public_by_location_uuid(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_uuid = database_hosts.uuid
            WHERE location_database_hosts.location_uuid = $1 AND database_hosts.public
            ORDER BY location_database_hosts.created DESC
            "#,
            Self::columns_sql(None)
        ))
        .bind(location_uuid)
        .fetch_all(database.read())
        .await?;

        Ok(rows.into_iter().map(|row| Self::map(None, &row)).collect())
    }

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        database_host_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM location_database_hosts
            WHERE location_database_hosts.location_uuid = $1 AND location_database_hosts.database_host_uuid = $2
            "#,
        )
        .bind(location_uuid)
        .bind(database_host_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiLocationDatabaseHost {
        AdminApiLocationDatabaseHost {
            database_host: self.database_host.into_admin_api_object(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "LocationDatabaseHost")]
pub struct AdminApiLocationDatabaseHost {
    pub database_host: super::database_host::AdminApiDatabaseHost,

    pub created: chrono::DateTime<chrono::Utc>,
}
