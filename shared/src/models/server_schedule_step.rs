use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct ExportedServerScheduleStep {
    pub action: wings_api::ScheduleActionInner,
    pub order: i16,
}

#[derive(Serialize, Deserialize)]
pub struct ServerScheduleStep {
    pub uuid: uuid::Uuid,

    pub action: wings_api::ScheduleActionInner,
    pub order: i16,
    pub error: Option<compact_str::CompactString>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerScheduleStep {
    const NAME: &'static str = "server_schedule_step";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "server_schedule_steps.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "server_schedule_steps.action",
                compact_str::format_compact!("{prefix}action"),
            ),
            (
                "server_schedule_steps.order_",
                compact_str::format_compact!("{prefix}order"),
            ),
            (
                "server_schedule_steps.error",
                compact_str::format_compact!("{prefix}error"),
            ),
            (
                "server_schedule_steps.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            action: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}action").as_str())?,
            )?,
            order: row.try_get(compact_str::format_compact!("{prefix}order").as_str())?,
            error: row.try_get(compact_str::format_compact!("{prefix}error").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl ServerScheduleStep {
    pub async fn create(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
        action: wings_api::ScheduleActionInner,
        order: i16,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_schedule_steps (schedule_uuid, action, order_, created)
            VALUES ($1, $2, $3, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(schedule_uuid)
        .bind(serde_json::to_value(action)?)
        .bind(order)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_schedule_uuid_uuid(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn all_by_schedule_uuid(
        database: &crate::database::Database,
        schedule_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
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

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
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

    #[inline]
    pub fn into_exported(self) -> ExportedServerScheduleStep {
        ExportedServerScheduleStep {
            action: self.action,
            order: self.order,
        }
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

#[async_trait::async_trait]
impl DeletableModel for ServerScheduleStep {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<ServerScheduleStep>> =
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
            DELETE FROM server_schedule_steps
            WHERE server_schedule_steps.uuid = $1
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
#[schema(title = "ServerScheduleStep")]
pub struct ApiServerScheduleStep {
    pub uuid: uuid::Uuid,

    pub action: wings_api::ScheduleActionInner,
    pub order: i16,
    pub error: Option<compact_str::CompactString>,

    pub created: chrono::DateTime<chrono::Utc>,
}
