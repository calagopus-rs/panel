use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserServerGroup {
    pub uuid: uuid::Uuid,
    pub name: compact_str::CompactString,
    pub order: i16,

    pub server_order: Vec<uuid::Uuid>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserServerGroup {
    const NAME: &'static str = "user_server_group";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "user_server_groups.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "user_server_groups.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "user_server_groups.order_",
                compact_str::format_compact!("{prefix}order"),
            ),
            (
                "user_server_groups.server_order",
                compact_str::format_compact!("{prefix}server_order"),
            ),
            (
                "user_server_groups.created",
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
            order: row.try_get(compact_str::format_compact!("{prefix}order").as_str())?,
            server_order: row
                .try_get(compact_str::format_compact!("{prefix}server_order").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl UserServerGroup {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        server_order: &[uuid::Uuid],
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_server_groups (user_uuid, name, server_order)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(server_order)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_user_uuid_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1 AND user_server_groups.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn all_by_user_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1
            ORDER BY user_server_groups.order_, user_server_groups.created
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .fetch_all(database.read())
        .await?;

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
    }

    pub async fn count_by_user_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1
            "#,
        )
        .bind(user_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserServerGroup {
        ApiUserServerGroup {
            uuid: self.uuid,
            name: self.name,
            order: self.order,
            server_order: self.server_order,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for UserServerGroup {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<UserServerGroup>> =
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
            DELETE FROM user_server_groups
            WHERE user_server_groups.uuid = $1
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
#[schema(title = "UserServerGroup")]
pub struct ApiUserServerGroup {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub order: i16,

    pub server_order: Vec<uuid::Uuid>,

    pub created: chrono::DateTime<chrono::Utc>,
}
