use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct LocationDatabaseHost {
    pub location_id: i32,
    pub database_host: super::database_host::DatabaseHost,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for LocationDatabaseHost {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("location_database_hosts");

        let mut columns = BTreeMap::from([
            (
                format!("{table}.location_id"),
                format!("{prefix}location_id"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::database_host::DatabaseHost::columns(
            Some("database_host_"),
            None,
        ));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            location_id: row.get(format!("{prefix}location_id").as_str()),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl LocationDatabaseHost {
    pub async fn create(
        database: &crate::database::Database,
        location_id: i32,
        database_host_id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO location_database_hosts (location_id, database_host_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(location_id)
        .bind(database_host_id)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_location_id_database_host_id(
        database: &crate::database::Database,
        location_id: i32,
        database_host_id: i32,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_id = database_hosts.id
            WHERE location_database_hosts.location_id = $1 AND location_database_hosts.database_host_id = $2
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(location_id)
        .bind(database_host_id)
        .fetch_optional(database.read())
        .await
        .unwrap()?;

        Some(Self::map(None, &row))
    }

    pub async fn by_location_id_with_pagination(
        database: &crate::database::Database,
        location_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_id = database_hosts.id
            WHERE location_database_hosts.location_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(location_id)
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

    pub async fn all_public_by_location_id(
        database: &crate::database::Database,
        location_id: i32,
    ) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM location_database_hosts
            JOIN database_hosts ON location_database_hosts.database_host_id = database_hosts.id
            WHERE location_database_hosts.location_id = $1 AND database_hosts.public
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(location_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    pub async fn delete_by_ids(
        database: &crate::database::Database,
        location_id: i32,
        database_host_id: i32,
    ) {
        sqlx::query(
            r#"
            DELETE FROM location_database_hosts
            WHERE location_id = $1 AND database_host_id = $2
            "#,
        )
        .bind(location_id)
        .bind(database_host_id)
        .execute(database.write())
        .await
        .unwrap();
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
