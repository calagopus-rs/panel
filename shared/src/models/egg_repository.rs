use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    path::PathBuf,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct EggRepository {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub git_repository: compact_str::CompactString,

    pub last_synced: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for EggRepository {
    const NAME: &'static str = "egg_repository";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "egg_repositories.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "egg_repositories.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "egg_repositories.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "egg_repositories.git_repository",
                compact_str::format_compact!("{prefix}git_repository"),
            ),
            (
                "egg_repositories.last_synced",
                compact_str::format_compact!("{prefix}last_synced"),
            ),
            (
                "egg_repositories.created",
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
            git_repository: row
                .try_get(compact_str::format_compact!("{prefix}git_repository").as_str())?,
            last_synced: row
                .try_get(compact_str::format_compact!("{prefix}last_synced").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl EggRepository {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        git_repository: &str,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO egg_repositories (name, description, git_repository)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(name)
        .bind(description)
        .bind(git_repository)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
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
            FROM egg_repositories
            WHERE ($1 IS NULL OR egg_repositories.name ILIKE '%' || $1 || '%')
            ORDER BY egg_repositories.created
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

    pub async fn sync(&self, database: &crate::database::Database) -> Result<usize, anyhow::Error> {
        let git_repository = self.git_repository.clone();

        let exported_eggs = tokio::task::spawn_blocking(
            move || -> Result<Vec<(PathBuf, super::nest_egg::ExportedNestEgg)>, anyhow::Error> {
                let mut exported_eggs = Vec::new();
                let temp_dir = tempfile::tempdir()?;
                let filesystem = crate::cap::CapFilesystem::new(temp_dir.path().to_path_buf())?;

                git2::Repository::clone(&git_repository, temp_dir.path())?;

                let mut walker = filesystem.walk_dir(".")?;
                while let Some(Ok((is_dir, entry))) = walker.next_entry() {
                    if is_dir {
                        continue;
                    }

                    if !matches!(
                        entry.extension().and_then(|s| s.to_str()),
                        Some("json") | Some("yaml")
                    ) {
                        continue;
                    }

                    let file_content = match filesystem.read_to_string(&entry) {
                        Ok(content) => content,
                        Err(_) => continue,
                    };
                    let exported_egg: super::nest_egg::ExportedNestEgg =
                        if entry.extension().and_then(|s| s.to_str()) == Some("json") {
                            match serde_json::from_str(&file_content) {
                                Ok(egg) => egg,
                                Err(_) => continue,
                            }
                        } else {
                            match serde_yml::from_str(&file_content) {
                                Ok(egg) => egg,
                                Err(_) => continue,
                            }
                        };

                    exported_eggs.push((entry, exported_egg));
                }

                Ok(exported_eggs)
            },
        )
        .await??;

        super::egg_repository_egg::EggRepositoryEgg::delete_unused(
            database,
            self.uuid,
            &exported_eggs
                .iter()
                .map(|(path, _)| path.to_string_lossy().to_string())
                .collect::<Vec<String>>(),
        )
        .await?;

        let exported_eggs_len = exported_eggs.len();

        for (path, exported_egg) in exported_eggs {
            super::egg_repository_egg::EggRepositoryEgg::create(
                database,
                self.uuid,
                &path.to_string_lossy(),
                &exported_egg.name,
                exported_egg.description.as_deref(),
                &exported_egg.author,
                &exported_egg,
            )
            .await?;
        }

        sqlx::query(
            r#"
            UPDATE egg_repositories
            SET last_synced = NOW()
            WHERE egg_repositories.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(exported_eggs_len)
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiEggRepository {
        AdminApiEggRepository {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            git_repository: self.git_repository,
            last_synced: self.last_synced.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for EggRepository {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM egg_repositories
            WHERE egg_repositories.uuid = $1
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
impl DeletableModel for EggRepository {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<EggRepository>> =
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
            DELETE FROM egg_repositories
            WHERE egg_repositories.uuid = $1
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
#[schema(title = "EggRepository")]
pub struct AdminApiEggRepository {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub git_repository: compact_str::CompactString,

    pub last_synced: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
