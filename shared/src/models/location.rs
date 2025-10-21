use super::{BaseModel, ByUuid, Fetchable};
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Location {
    pub uuid: uuid::Uuid,
    pub backup_configuration: Option<Fetchable<super::backup_configurations::BackupConfiguration>>,

    pub name: String,
    pub description: Option<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Location {
    const NAME: &'static str = "location";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("locations.uuid", format!("{prefix}uuid")),
            (
                "locations.backup_configuration_uuid",
                format!("{prefix}location_backup_configuration_uuid"),
            ),
            ("locations.name", format!("{prefix}name")),
            ("locations.description", format!("{prefix}description")),
            ("locations.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            backup_configuration:
                super::backup_configurations::BackupConfiguration::get_fetchable_from_row(
                    row,
                    format!("{prefix}location_backup_configuration_uuid"),
                ),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Location {
    pub async fn create(
        database: &crate::database::Database,
        backup_configuration_uuid: Option<uuid::Uuid>,
        name: &str,
        description: Option<&str>,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO locations (backup_configuration_uuid, name, description)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(backup_configuration_uuid)
        .bind(name)
        .bind(description)
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
            FROM locations
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            WHERE locations.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_backup_configuration_uuid_with_pagination(
        database: &crate::database::Database,
        backup_configuration_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM locations
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            WHERE locations.backup_configuration_uuid = $1 AND ($2 IS NULL OR locations.name ILIKE '%' || $2 || '%')
            ORDER BY locations.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(backup_configuration_uuid)
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
            FROM locations
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            WHERE $1 IS NULL OR locations.name ILIKE '%' || $1 || '%'
            ORDER BY locations.created
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
            DELETE FROM locations
            WHERE locations.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
    ) -> AdminApiLocation {
        AdminApiLocation {
            uuid: self.uuid,
            backup_configuration: if let Some(backup_configuration) = self.backup_configuration {
                if let Ok(backup_configuration) = backup_configuration.fetch_cached(database).await
                {
                    backup_configuration
                        .into_admin_api_object(database)
                        .await
                        .ok()
                } else {
                    None
                }
            } else {
                None
            },
            name: self.name,
            description: self.description,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Location")]
pub struct AdminApiLocation {
    pub uuid: uuid::Uuid,
    pub backup_configuration: Option<super::backup_configurations::AdminApiBackupConfiguration>,

    pub name: String,
    pub description: Option<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
