use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerScheduleStep {
    pub uuid: uuid::Uuid,

    pub action: wings_api::ScheduleActionInner,
    pub order: i16,
    pub error: Option<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerScheduleStep {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("server_schedule_steps.uuid", format!("{prefix}uuid")),
            ("server_schedule_steps.action", format!("{prefix}action")),
            ("server_schedule_steps.order_", format!("{prefix}order")),
            ("server_schedule_steps.error", format!("{prefix}error")),
            ("server_schedule_steps.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            action: serde_json::from_value(row.get(format!("{prefix}action").as_str())).unwrap(),
            order: row.get(format!("{prefix}order").as_str()),
            error: row.get(format!("{prefix}error").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerScheduleStep {
    pub async fn create(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
        action: wings_api::ScheduleActionInner,
        order: i16,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_schedule_steps (schedule_uuid, action, order_, created)
            VALUES ($1, $2, $3, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(schedule_uuid)
        .bind(serde_json::to_value(action).unwrap())
        .bind(order)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_schedule_uuid_uuid(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_schedule_steps
            WHERE server_schedule_steps.schedule_uuid = $1 AND server_schedule_steps.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(schedule_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_by_schedule_uuid(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_schedule_steps
            WHERE server_schedule_steps.schedule_uuid = $1
            ORDER BY server_schedule_steps.order_, server_schedule_steps.created
            "#,
            Self::columns_sql(None)
        ))
        .bind(schedule_uuid)
        .fetch_all(database.read())
        .await?;

        Ok(rows.into_iter().map(|row| Self::map(None, &row)).collect())
    }

    pub async fn count_by_schedule_uuid(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_schedule_steps
            WHERE server_schedule_steps.schedule_uuid = $1
            "#,
        )
        .bind(schedule_uuid)
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
            DELETE FROM server_schedule_steps
            WHERE server_schedule_steps.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerScheduleStep {
        ApiServerScheduleStep {
            uuid: self.uuid,
            action: self.action,
            order: self.order,
            error: self.error,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerScheduleStep")]
pub struct ApiServerScheduleStep {
    pub uuid: uuid::Uuid,

    pub action: wings_api::ScheduleActionInner,
    pub order: i16,
    pub error: Option<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
