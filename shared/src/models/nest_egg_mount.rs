use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NestEggMount {
    pub mount: Fetchable<super::mount::Mount>,
    pub nest_egg: Fetchable<super::nest_egg::NestEgg>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEggMount {
    const NAME: &'static str = "nest_egg_mount";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "nest_egg_mounts.mount_uuid",
                compact_str::format_compact!("{prefix}mount_uuid"),
            ),
            (
                "nest_egg_mounts.egg_uuid",
                compact_str::format_compact!("{prefix}egg_uuid"),
            ),
            (
                "nest_egg_mounts.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            mount: super::mount::Mount::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}mount_uuid").as_str())?,
            ),
            nest_egg: super::nest_egg::NestEgg::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}egg_uuid").as_str())?,
            ),
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl NestEggMount {
    pub async fn create(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            INSERT INTO nest_egg_mounts (egg_uuid, mount_uuid)
            VALUES ($1, $2)
            "#,
        )
        .bind(egg_uuid)
        .bind(mount_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_egg_uuid_mount_uuid(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        mount_uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_mounts
            JOIN mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE nest_egg_mounts.egg_uuid = $1 AND nest_egg_mounts.mount_uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_uuid)
        .bind(mount_uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_egg_uuid_with_pagination(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_egg_mounts
            JOIN mounts ON mounts.uuid = nest_egg_mounts.mount_uuid
            WHERE nest_egg_mounts.egg_uuid = $1 AND ($2 IS NULL OR mounts.name ILIKE '%' || $2 || '%')
            ORDER BY nest_egg_mounts.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_uuid)
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

    pub async fn by_mount_uuid_with_pagination(
        database: &crate::database::Database,
        mount_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_egg_mounts
            JOIN nest_eggs ON nest_eggs.uuid = nest_egg_mounts.egg_uuid
            WHERE nest_egg_mounts.mount_uuid = $1 AND ($2 IS NULL OR nest_eggs.name ILIKE '%' || $2 || '%')
            ORDER BY nest_egg_mounts.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(mount_uuid)
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
    pub async fn into_admin_nest_egg_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiNestEggNestEggMount, crate::database::DatabaseError> {
        let nest_egg = self.nest_egg.fetch_cached(database).await?;
        let nest = nest_egg.nest.clone();
        let (nest, nest_egg) = tokio::try_join!(nest.fetch_cached(database), async {
            Ok(nest_egg.into_admin_api_object(database).await?)
        })?;

        Ok(AdminApiNestEggNestEggMount {
            nest: nest.into_admin_api_object(),
            nest_egg,
            created: self.created.and_utc(),
        })
    }

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiNestEggMount, crate::database::DatabaseError> {
        Ok(AdminApiNestEggMount {
            mount: self
                .mount
                .fetch_cached(database)
                .await?
                .into_admin_api_object(),
            created: self.created.and_utc(),
        })
    }
}

#[async_trait::async_trait]
impl DeletableModel for NestEggMount {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<NestEggMount>> =
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
            DELETE FROM nest_egg_mounts
            WHERE nest_egg_mounts.egg_uuid = $1 AND nest_egg_mounts.mount_uuid = $2
            "#,
        )
        .bind(self.nest_egg.uuid)
        .bind(self.mount.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminNestEggNestEggMount")]
pub struct AdminApiNestEggNestEggMount {
    pub nest: super::nest::AdminApiNest,
    pub nest_egg: super::nest_egg::AdminApiNestEgg,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminNestEggMount")]
pub struct AdminApiNestEggMount {
    pub mount: super::mount::AdminApiMount,

    pub created: chrono::DateTime<chrono::Utc>,
}
