use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerSchedule {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub enabled: bool,

    pub triggers: Vec<wings_api::ScheduleTrigger>,
    pub condition: wings_api::ScheduleCondition,

    pub steps: i64,

    pub last_run: Option<chrono::NaiveDateTime>,
    pub last_failure: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerSchedule {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("server_schedules.uuid", format!("{prefix}uuid")),
            ("server_schedules.name", format!("{prefix}name")),
            ("server_schedules.enabled", format!("{prefix}enabled")),
            ("server_schedules.triggers", format!("{prefix}triggers")),
            ("server_schedules.condition", format!("{prefix}condition")),
            (
                "(SELECT COUNT(*) FROM server_schedule_steps WHERE server_schedule_steps.schedule_uuid = server_schedules.uuid)",
                format!("{prefix}steps"),
            ),
            ("server_schedules.last_run", format!("{prefix}last_run")),
            (
                "server_schedules.last_failure",
                format!("{prefix}last_failure"),
            ),
            ("server_schedules.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            enabled: row.get(format!("{prefix}enabled").as_str()),
            triggers: serde_json::from_value(row.get(format!("{prefix}triggers").as_str()))
                .unwrap(),
            condition: serde_json::from_value(row.get(format!("{prefix}condition").as_str()))
                .unwrap(),
            steps: row.get(format!("{prefix}steps").as_str()),
            last_run: row.get(format!("{prefix}last_run").as_str()),
            last_failure: row.get(format!("{prefix}last_failure").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerSchedule {
    pub async fn create(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        name: &str,
        enabled: bool,
        triggers: Vec<wings_api::ScheduleTrigger>,
        condition: wings_api::ScheduleCondition,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_schedules (server_uuid, name, enabled, triggers, condition, created)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .bind(name)
        .bind(enabled)
        .bind(serde_json::to_value(triggers).unwrap())
        .bind(serde_json::to_value(condition).unwrap())
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
            FROM server_schedules
            WHERE server_schedules.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_schedules
            WHERE server_schedules.server_uuid = $1 AND server_schedules.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_schedules
            WHERE server_schedules.server_uuid = $1 AND ($2 IS NULL OR server_schedules.name ILIKE '%' || $2 || '%')
            ORDER BY server_schedules.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
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

    pub async fn count_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_schedules
            WHERE server_schedules.server_uuid = $1
            "#,
        )
        .bind(server_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM server_schedules
            WHERE server_schedules.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerSchedule {
        ApiServerSchedule {
            uuid: self.uuid,
            name: self.name,
            enabled: self.enabled,
            triggers: self.triggers,
            condition: self.condition,
            steps: self.steps,
            last_run: self.last_run.map(|dt| dt.and_utc()),
            last_failure: self.last_failure.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerSchedule")]
pub struct ApiServerSchedule {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub enabled: bool,

    pub triggers: Vec<wings_api::ScheduleTrigger>,
    pub condition: wings_api::ScheduleCondition,

    pub steps: i64,

    pub last_run: Option<chrono::DateTime<chrono::Utc>>,
    pub last_failure: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
