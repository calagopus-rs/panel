use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct EggRepositoryEgg {
    pub uuid: uuid::Uuid,
    pub path: String,
    pub egg_repository: Fetchable<super::egg_repository::EggRepository>,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub author: compact_str::CompactString,

    pub exported_egg: super::nest_egg::ExportedNestEgg,
}

impl BaseModel for EggRepositoryEgg {
    const NAME: &'static str = "egg_repository_egg";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "egg_repository_eggs.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "egg_repository_eggs.path",
                compact_str::format_compact!("{prefix}path"),
            ),
            (
                "egg_repository_eggs.egg_repository_uuid",
                compact_str::format_compact!("{prefix}egg_repository_uuid"),
            ),
            (
                "egg_repository_eggs.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "egg_repository_eggs.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "egg_repository_eggs.author",
                compact_str::format_compact!("{prefix}author"),
            ),
            (
                "egg_repository_eggs.exported_egg",
                compact_str::format_compact!("{prefix}exported_egg"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            path: row.try_get(compact_str::format_compact!("{prefix}path").as_str())?,
            egg_repository: super::egg_repository::EggRepository::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}egg_repository_uuid").as_str())?,
            ),
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            description: row
                .try_get(compact_str::format_compact!("{prefix}description").as_str())?,
            author: row.try_get(compact_str::format_compact!("{prefix}author").as_str())?,
            exported_egg: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}exported_egg").as_str())?,
            )?,
        })
    }
}

impl EggRepositoryEgg {
    pub async fn create(
        database: &crate::database::Database,
        egg_repository_uuid: uuid::Uuid,
        path: &str,
        name: &str,
        description: Option<&str>,
        author: &str,
        exported_egg: &super::nest_egg::ExportedNestEgg,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO egg_repository_eggs (egg_repository_uuid, path, author, name, description, exported_egg)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (egg_repository_uuid, path) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                author = EXCLUDED.author,
                exported_egg = EXCLUDED.exported_egg
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_repository_uuid)
        .bind(path)
        .bind(author)
        .bind(name)
        .bind(description)
        .bind(serde_json::to_value(exported_egg)?)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_egg_repository_uuid_uuid(
        database: &crate::database::Database,
        egg_repository_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM egg_repository_eggs
            WHERE egg_repository_eggs.egg_repository_uuid = $1 AND egg_repository_eggs.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_repository_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        match row {
            Some(row) => Ok(Some(Self::map(None, &row)?)),
            None => Ok(None),
        }
    }

    pub async fn by_egg_repository_uuid_with_pagination(
        database: &crate::database::Database,
        egg_repository_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM egg_repository_eggs
            WHERE egg_repository_eggs.egg_repository_uuid = $1 AND ($2 IS NULL OR egg_repository_eggs.path ILIKE '%' || $2 || '%' OR egg_repository_eggs.name ILIKE '%' || $2 || '%')
            ORDER BY egg_repository_eggs.name
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_repository_uuid)
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

    pub async fn delete_unused(
        database: &crate::database::Database,
        egg_repository_uuid: uuid::Uuid,
        paths: &[String],
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            DELETE FROM egg_repository_eggs
            WHERE egg_repository_eggs.egg_repository_uuid = $1 AND egg_repository_eggs.path != ALL($2)
            "#,
        )
        .bind(egg_repository_uuid)
        .bind(paths)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiEggRepositoryEgg {
        AdminApiEggRepositoryEgg {
            uuid: self.uuid,
            path: self.path,
            name: self.name,
            description: self.description,
            author: self.author,
            exported_egg: self.exported_egg,
        }
    }

    #[inline]
    pub async fn into_admin_egg_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiEggEggRepositoryEgg, crate::database::DatabaseError> {
        Ok(AdminApiEggEggRepositoryEgg {
            uuid: self.uuid,
            path: self.path,
            egg_repository: self
                .egg_repository
                .fetch_cached(database)
                .await?
                .into_admin_api_object(),
            name: self.name,
            description: self.description,
            author: self.author,
            exported_egg: self.exported_egg,
        })
    }
}

#[async_trait::async_trait]
impl ByUuid for EggRepositoryEgg {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM egg_repository_eggs
            WHERE egg_repository_eggs.uuid = $1
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
impl DeletableModel for EggRepositoryEgg {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<EggRepositoryEgg>> =
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
            DELETE FROM egg_repository_eggs
            WHERE egg_repository_eggs.path = $1
            "#,
        )
        .bind(&self.path)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "EggRepositoryEgg")]
pub struct AdminApiEggRepositoryEgg {
    pub uuid: uuid::Uuid,
    pub path: String,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub author: compact_str::CompactString,

    pub exported_egg: super::nest_egg::ExportedNestEgg,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "EggEggRepositoryEgg")]
pub struct AdminApiEggEggRepositoryEgg {
    pub uuid: uuid::Uuid,
    pub path: String,
    pub egg_repository: super::egg_repository::AdminApiEggRepository,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub author: compact_str::CompactString,

    pub exported_egg: super::nest_egg::ExportedNestEgg,
}
