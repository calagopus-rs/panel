use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct LocationDatabaseHost {
    pub location: Fetchable<super::location::Location>,
    pub database_host: super::database_host::DatabaseHost,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for LocationDatabaseHost {
    const NAME: &'static str = "location_database_host";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            (
                "location_database_hosts.location_uuid",
                compact_str::format_compact!("{prefix}location_uuid"),
            ),
            (
                "location_database_hosts.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ]);

        columns.extend(super::database_host::DatabaseHost::columns(Some(
            "database_host_",
        )));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            location: super::location::Location::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}location_uuid").as_str())?,
            ),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row)?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl LocationDatabaseHost {
    pub async fn create(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        database_host_uuid: uuid::Uuid,
    ) -> Result<(), crate::database::DatabaseError> {
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
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_location_uuid_with_pagination(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
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
            total: rows
                .first()
                .map_or(Ok(0), |row| row.try_get("total_count"))?,
            per_page,
            page,
            data: rows
                .into_iter()
                .map(|row| Self::map(None, &row))
                .try_collect_vec()?,
        })
    }

    pub async fn all_public_by_location_uuid(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
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

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiLocationDatabaseHost {
        AdminApiLocationDatabaseHost {
            database_host: self.database_host.into_admin_api_object(),
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for LocationDatabaseHost {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<LocationDatabaseHost>> =
            LazyLock::new(|| Arc::new(ListenerList::default()));

        &DELETE_LISTENERS
    }

    async fn delete(
        &self,
        database: &Arc<crate::database::Database>,
        options: Self::DeleteOptions,
    ) -> Result<(), anyhow::Error> {
        let mut transaction = database.write().begin().await?;

        self.run_delete_listeners(&options, database, &mut transaction)
            .await?;

        sqlx::query(
            r#"
            DELETE FROM location_database_hosts
            WHERE location_database_hosts.location_uuid = $1 AND location_database_hosts.database_host_uuid = $2
            "#,
        )
        .bind(self.location.uuid)
        .bind(self.database_host.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "LocationDatabaseHost")]
pub struct AdminApiLocationDatabaseHost {
    pub database_host: super::database_host::AdminApiDatabaseHost,

    pub created: chrono::DateTime<chrono::Utc>,
}
