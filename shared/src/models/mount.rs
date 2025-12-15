use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Mount {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub source: compact_str::CompactString,
    pub target: compact_str::CompactString,

    pub read_only: bool,
    pub user_mountable: bool,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Mount {
    const NAME: &'static str = "mount";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("mounts.uuid", compact_str::format_compact!("{prefix}uuid")),
            ("mounts.name", compact_str::format_compact!("{prefix}name")),
            (
                "mounts.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "mounts.source",
                compact_str::format_compact!("{prefix}source"),
            ),
            (
                "mounts.target",
                compact_str::format_compact!("{prefix}target"),
            ),
            (
                "mounts.read_only",
                compact_str::format_compact!("{prefix}read_only"),
            ),
            (
                "mounts.user_mountable",
                compact_str::format_compact!("{prefix}user_mountable"),
            ),
            (
                "mounts.created",
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
            description: row
                .try_get(compact_str::format_compact!("{prefix}description").as_str())?,
            source: row.try_get(compact_str::format_compact!("{prefix}source").as_str())?,
            target: row.try_get(compact_str::format_compact!("{prefix}target").as_str())?,
            read_only: row.try_get(compact_str::format_compact!("{prefix}read_only").as_str())?,
            user_mountable: row
                .try_get(compact_str::format_compact!("{prefix}user_mountable").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl Mount {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        source: &str,
        target: &str,
        read_only: bool,
        user_mountable: bool,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO mounts (name, description, source, target, read_only, user_mountable)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(name)
        .bind(description)
        .bind(source)
        .bind(target)
        .bind(read_only)
        .bind(user_mountable)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_node_uuid_egg_uuid_uuid(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        egg_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            JOIN node_mounts ON mounts.uuid = node_mounts.mount_uuid
            JOIN nest_egg_mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE node_mounts.node_uuid = $1 AND nest_egg_mounts.egg_uuid = $2 AND mounts.uuid = $3
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
        .bind(egg_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM mounts
            WHERE ($1 IS NULL OR mounts.name ILIKE '%' || $1 || '%')
            ORDER BY mounts.created
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

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiMount {
        AdminApiMount {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            source: self.source,
            target: self.target,
            read_only: self.read_only,
            user_mountable: self.user_mountable,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for Mount {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM mounts
            WHERE mounts.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[async_trait::async_trait]
impl DeletableModel for Mount {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<Mount>> =
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
            DELETE FROM mounts
            WHERE mounts.uuid = $1
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
#[schema(title = "Mount")]
pub struct AdminApiMount {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub source: compact_str::CompactString,
    pub target: compact_str::CompactString,

    pub read_only: bool,
    pub user_mountable: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
