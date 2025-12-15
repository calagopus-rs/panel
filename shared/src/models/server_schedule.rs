use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;
use validator::Validate;

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExportedServerSchedule {
    #[validate(length(min = 1, max = 255))]
    #[schema(min_length = 1, max_length = 255)]
    pub name: compact_str::CompactString,
    pub enabled: bool,

    pub triggers: Vec<wings_api::ScheduleTrigger>,
    pub condition: wings_api::SchedulePreCondition,

    pub steps: Vec<super::server_schedule_step::ExportedServerScheduleStep>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerSchedule {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub enabled: bool,

    pub triggers: Vec<wings_api::ScheduleTrigger>,
    pub condition: wings_api::SchedulePreCondition,

    pub last_run: Option<chrono::NaiveDateTime>,
    pub last_failure: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerSchedule {
    const NAME: &'static str = "server_schedule";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "server_schedules.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "server_schedules.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "server_schedules.enabled",
                compact_str::format_compact!("{prefix}enabled"),
            ),
            (
                "server_schedules.triggers",
                compact_str::format_compact!("{prefix}triggers"),
            ),
            (
                "server_schedules.condition",
                compact_str::format_compact!("{prefix}condition"),
            ),
            (
                "server_schedules.last_run",
                compact_str::format_compact!("{prefix}last_run"),
            ),
            (
                "server_schedules.last_failure",
                compact_str::format_compact!("{prefix}last_failure"),
            ),
            (
                "server_schedules.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            enabled: row.try_get(compact_str::format_compact!("{prefix}enabled").as_str())?,
            triggers: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}triggers").as_str())?,
            )?,
            condition: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}condition").as_str())?,
            )?,
            last_run: row.try_get(compact_str::format_compact!("{prefix}last_run").as_str())?,
            last_failure: row
                .try_get(compact_str::format_compact!("{prefix}last_failure").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl ServerSchedule {
    pub async fn create(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        name: &str,
        enabled: bool,
        triggers: Vec<wings_api::ScheduleTrigger>,
        condition: wings_api::SchedulePreCondition,
    ) -> Result<Self, crate::database::DatabaseError> {
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
        .bind(serde_json::to_value(triggers)?)
        .bind(serde_json::to_value(condition)?)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
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

    #[inline]
    pub async fn into_exported(
        self,
        database: &crate::database::Database,
    ) -> Result<ExportedServerSchedule, crate::database::DatabaseError> {
        Ok(ExportedServerSchedule {
            name: self.name,
            enabled: self.enabled,
            triggers: self.triggers,
            condition: self.condition,
            steps: super::server_schedule_step::ServerScheduleStep::all_by_schedule_uuid(
                database, self.uuid,
            )
            .await?
            .into_iter()
            .map(|step| step.into_exported())
            .collect(),
        })
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerSchedule {
        ApiServerSchedule {
            uuid: self.uuid,
            name: self.name,
            enabled: self.enabled,
            triggers: self.triggers,
            condition: self.condition,
            last_run: self.last_run.map(|dt| dt.and_utc()),
            last_failure: self.last_failure.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for ServerSchedule {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<ServerSchedule>> =
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
            DELETE FROM server_schedules
            WHERE server_schedules.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerSchedule")]
pub struct ApiServerSchedule {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub enabled: bool,

    pub triggers: Vec<wings_api::ScheduleTrigger>,
    pub condition: wings_api::SchedulePreCondition,

    pub last_run: Option<chrono::DateTime<chrono::Utc>>,
    pub last_failure: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
