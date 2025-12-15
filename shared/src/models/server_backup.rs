use crate::prelude::*;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
#[schema(rename_all = "kebab-case")]
#[sqlx(type_name = "backup_disk", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BackupDisk {
    Local,
    S3,
    DdupBak,
    Btrfs,
    Zfs,
    Restic,
}

impl BackupDisk {
    #[inline]
    pub fn to_wings_adapter(self) -> wings_api::BackupAdapter {
        match self {
            BackupDisk::Local => wings_api::BackupAdapter::Wings,
            BackupDisk::S3 => wings_api::BackupAdapter::S3,
            BackupDisk::DdupBak => wings_api::BackupAdapter::DdupBak,
            BackupDisk::Btrfs => wings_api::BackupAdapter::Btrfs,
            BackupDisk::Zfs => wings_api::BackupAdapter::Zfs,
            BackupDisk::Restic => wings_api::BackupAdapter::Restic,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerBackup {
    pub uuid: uuid::Uuid,
    pub server: Option<Fetchable<super::server::Server>>,
    pub node: Fetchable<super::node::Node>,
    pub backup_configuration: Option<Fetchable<super::backup_configurations::BackupConfiguration>>,

    pub name: compact_str::CompactString,
    pub successful: bool,
    pub browsable: bool,
    pub streaming: bool,
    pub locked: bool,

    pub ignored_files: Vec<compact_str::CompactString>,
    pub checksum: Option<String>,
    pub bytes: i64,
    pub files: i64,

    pub disk: BackupDisk,
    pub upload_id: Option<compact_str::CompactString>,
    pub upload_path: Option<String>,

    pub completed: Option<chrono::NaiveDateTime>,
    pub deleted: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerBackup {
    const NAME: &'static str = "server_backup";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "server_backups.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "server_backups.server_uuid",
                compact_str::format_compact!("{prefix}server_uuid"),
            ),
            (
                "server_backups.node_uuid",
                compact_str::format_compact!("{prefix}node_uuid"),
            ),
            (
                "server_backups.backup_configuration_uuid",
                compact_str::format_compact!("{prefix}backup_configuration_uuid"),
            ),
            (
                "server_backups.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "server_backups.successful",
                compact_str::format_compact!("{prefix}successful"),
            ),
            (
                "server_backups.browsable",
                compact_str::format_compact!("{prefix}browsable"),
            ),
            (
                "server_backups.streaming",
                compact_str::format_compact!("{prefix}streaming"),
            ),
            (
                "server_backups.locked",
                compact_str::format_compact!("{prefix}locked"),
            ),
            (
                "server_backups.ignored_files",
                compact_str::format_compact!("{prefix}ignored_files"),
            ),
            (
                "server_backups.checksum",
                compact_str::format_compact!("{prefix}checksum"),
            ),
            (
                "server_backups.bytes",
                compact_str::format_compact!("{prefix}bytes"),
            ),
            (
                "server_backups.files",
                compact_str::format_compact!("{prefix}files"),
            ),
            (
                "server_backups.disk",
                compact_str::format_compact!("{prefix}disk"),
            ),
            (
                "server_backups.upload_id",
                compact_str::format_compact!("{prefix}upload_id"),
            ),
            (
                "server_backups.upload_path",
                compact_str::format_compact!("{prefix}upload_path"),
            ),
            (
                "server_backups.completed",
                compact_str::format_compact!("{prefix}completed"),
            ),
            (
                "server_backups.deleted",
                compact_str::format_compact!("{prefix}deleted"),
            ),
            (
                "server_backups.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            server: super::server::Server::get_fetchable_from_row(
                row,
                compact_str::format_compact!("{prefix}server_uuid"),
            ),
            backup_configuration:
                super::backup_configurations::BackupConfiguration::get_fetchable_from_row(
                    row,
                    compact_str::format_compact!("{prefix}backup_configuration_uuid"),
                ),
            node: super::node::Node::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}node_uuid").as_str())?,
            ),
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            successful: row.try_get(compact_str::format_compact!("{prefix}successful").as_str())?,
            browsable: row.try_get(compact_str::format_compact!("{prefix}browsable").as_str())?,
            streaming: row.try_get(compact_str::format_compact!("{prefix}streaming").as_str())?,
            locked: row.try_get(compact_str::format_compact!("{prefix}locked").as_str())?,
            ignored_files: row
                .try_get(compact_str::format_compact!("{prefix}ignored_files").as_str())?,
            checksum: row.try_get(compact_str::format_compact!("{prefix}checksum").as_str())?,
            bytes: row.try_get(compact_str::format_compact!("{prefix}bytes").as_str())?,
            files: row.try_get(compact_str::format_compact!("{prefix}files").as_str())?,
            disk: row.try_get(compact_str::format_compact!("{prefix}disk").as_str())?,
            upload_id: row.try_get(compact_str::format_compact!("{prefix}upload_id").as_str())?,
            upload_path: row
                .try_get(compact_str::format_compact!("{prefix}upload_path").as_str())?,
            completed: row.try_get(compact_str::format_compact!("{prefix}completed").as_str())?,
            deleted: row.try_get(compact_str::format_compact!("{prefix}deleted").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl ServerBackup {
    pub async fn create(
        database: &Arc<crate::database::Database>,
        server: super::server::Server,
        name: &str,
        ignored_files: Vec<String>,
    ) -> Result<Self, anyhow::Error> {
        let backup_configuration =
            server.backup_configuration(database).await.ok_or_else(|| {
                crate::response::DisplayError::new(
                    "no backup configuration available, unable to create backup",
                )
                .with_status(StatusCode::EXPECTATION_FAILED)
            })?;

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_backups (server_uuid, node_uuid, backup_configuration_uuid, name, ignored_files, bytes, disk)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(server.uuid)
        .bind(server.node.uuid)
        .bind(backup_configuration.uuid)
        .bind(name)
        .bind(&ignored_files)
        .bind(0i64)
        .bind(backup_configuration.backup_disk)
        .fetch_one(database.write())
        .await?;

        tokio::spawn({
            let uuid = row.get::<uuid::Uuid, _>("uuid");
            let backup_disk = backup_configuration.backup_disk;
            let database = Arc::clone(database);

            async move {
                tracing::debug!(backup = %uuid, "creating server backup");

                let node = match server.node.fetch_cached(&database).await {
                    Ok(node) => node,
                    Err(err) => {
                        tracing::error!(backup = %uuid, "failed to create server backup: {:?}", err);

                        if let Err(err) = sqlx::query!(
                            r#"
                            UPDATE server_backups
                            SET successful = false, completed = NOW()
                            WHERE server_backups.uuid = $1
                            "#,
                            uuid
                        )
                        .execute(database.write())
                        .await
                        {
                            tracing::error!(backup = %uuid, "failed to update server backup status: {:?}", err);
                        }

                        return;
                    }
                };

                if let Err(err) = node
                    .api_client(&database)
                    .post_servers_server_backup(
                        server.uuid,
                        &wings_api::servers_server_backup::post::RequestBody {
                            adapter: backup_disk.to_wings_adapter(),
                            uuid,
                            ignore: ignored_files.join("\n").into(),
                        },
                    )
                    .await
                {
                    tracing::error!(backup = %uuid, "failed to create server backup: {:?}", err);

                    if let Err(err) = sqlx::query!(
                        r#"
                        UPDATE server_backups
                        SET successful = false, completed = NOW()
                        WHERE server_backups.uuid = $1
                        "#,
                        uuid
                    )
                    .execute(database.write())
                    .await
                    {
                        tracing::error!(backup = %uuid, "failed to update server backup status: {:?}", err);
                    }
                }
            }
        });

        Ok(Self::map(None, &row)?)
    }

    pub async fn create_raw(
        database: &Arc<crate::database::Database>,
        server: &super::server::Server,
        name: &str,
        ignored_files: Vec<String>,
    ) -> Result<Self, anyhow::Error> {
        let backup_configuration =
            server.backup_configuration(database).await.ok_or_else(|| {
                crate::response::DisplayError::new(
                    "no backup configuration available, unable to create backup",
                )
                .with_status(StatusCode::EXPECTATION_FAILED)
            })?;

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_backups (server_uuid, node_uuid, backup_configuration_uuid, name, ignored_files, bytes, disk)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(server.uuid)
        .bind(server.node.uuid)
        .bind(backup_configuration.uuid)
        .bind(name)
        .bind(&ignored_files)
        .bind(0i64)
        .bind(backup_configuration.backup_disk)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row)?)
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_uuid = $1 AND server_backups.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_node_uuid_uuid(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.node_uuid = $1 AND server_backups.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
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
            FROM server_backups
            WHERE
                server_backups.server_uuid = $1
                AND server_backups.deleted IS NULL
                AND ($2 IS NULL OR server_backups.name ILIKE '%' || $2 || '%')
            ORDER BY server_backups.created
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

    pub async fn by_detached_node_uuid_with_pagination(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_backups
            WHERE
                server_backups.node_uuid = $1
                AND server_backups.server_uuid IS NULL
                AND server_backups.deleted IS NULL
                AND ($2 IS NULL OR server_backups.name ILIKE '%' || $2 || '%')
            ORDER BY server_backups.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
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

    pub async fn all_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_uuid = $1 AND server_backups.deleted IS NULL
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .fetch_all(database.read())
        .await?;

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
    }

    pub async fn count_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_backups
            WHERE server_backups.server_uuid = $1 AND server_backups.deleted IS NULL
            "#,
        )
        .bind(server_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn restore(
        self,
        database: &crate::database::Database,
        server: super::server::Server,
        truncate_directory: bool,
    ) -> Result<(), anyhow::Error> {
        let backup_configuration = self
            .backup_configuration
            .ok_or_else(|| {
                crate::response::DisplayError::new(
                    "no backup configuration available, unable to restore backup",
                )
                .with_status(StatusCode::EXPECTATION_FAILED)
            })?
            .fetch_cached(database)
            .await?;

        server
            .node
            .fetch_cached(database)
            .await?
            .api_client(database)
            .post_servers_server_backup_backup_restore(
                server.uuid,
                self.uuid,
                &wings_api::servers_server_backup_backup_restore::post::RequestBody {
                    adapter: self.disk.to_wings_adapter(),
                    download_url: match self.disk {
                        BackupDisk::S3 => {
                            if let Some(mut s3_configuration) =
                                backup_configuration.backup_configs.s3
                            {
                                s3_configuration.decrypt(database).await?;

                                let client = s3_configuration.into_client()?;
                                let file_path = match &self.upload_path {
                                    Some(path) => path,
                                    None => &Self::s3_path(server.uuid, self.uuid),
                                };

                                Some(client.presign_get(file_path, 60 * 60, None).await?.into())
                            } else {
                                None
                            }
                        }
                        _ => None,
                    },
                    truncate_directory,
                },
            )
            .await?;

        Ok(())
    }

    pub async fn delete_oldest_by_server_uuid(
        database: &Arc<crate::database::Database>,
        server: &super::server::Server,
    ) -> Result<(), anyhow::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_uuid = $1
                AND server_backups.locked = false
                AND server_backups.completed IS NOT NULL
                AND server_backups.deleted IS NULL
            ORDER BY server_backups.created ASC
            LIMIT 1
            "#,
            Self::columns_sql(None)
        ))
        .bind(server.uuid)
        .fetch_optional(database.read())
        .await?;

        if let Some(row) = row {
            let backup = Self::map(None, &row)?;

            backup.delete(database, ()).await
        } else {
            Err(sqlx::Error::RowNotFound.into())
        }
    }

    #[inline]
    pub fn s3_path(server_uuid: uuid::Uuid, backup_uuid: uuid::Uuid) -> String {
        format!("{server_uuid}/{backup_uuid}.tar.gz")
    }

    #[inline]
    pub fn s3_content_type(name: &str) -> &'static str {
        if name.ends_with(".tar.gz") {
            "application/x-gzip"
        } else {
            "application/octet-stream"
        }
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerBackup {
        ApiServerBackup {
            uuid: self.uuid,
            name: self.name,
            ignored_files: self.ignored_files,
            is_successful: self.successful,
            is_locked: self.locked,
            is_browsable: self.browsable,
            is_streaming: self.streaming,
            checksum: self.checksum,
            bytes: self.bytes,
            files: self.files,
            completed: self.completed.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for ServerBackup {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.uuid = $1
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
impl DeletableModel for ServerBackup {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<ServerBackup>> =
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

        let node = self.node.fetch_cached(database).await?;

        let backup_configuration = self
            .backup_configuration
            .as_ref()
            .ok_or_else(|| {
                crate::response::DisplayError::new(
                    "no backup configuration available, unable to delete backup",
                )
                .with_status(StatusCode::EXPECTATION_FAILED)
            })?
            .fetch_cached(database)
            .await?;

        let database = Arc::clone(database);
        let server_uuid = self.server.as_ref().map(|s| s.uuid);
        let backup_uuid = self.uuid;
        let backup_disk = self.disk;
        let backup_upload_path = self.upload_path.clone();

        tokio::spawn(async move {
            match backup_disk {
                BackupDisk::S3 => {
                    if let Some(mut s3_configuration) = backup_configuration.backup_configs.s3 {
                        s3_configuration.decrypt(&database).await?;

                        let client = s3_configuration
                            .into_client()
                            .map_err(|err| sqlx::Error::Io(std::io::Error::other(err)))?;
                        let file_path = match backup_upload_path {
                            Some(path) => path,
                            None => if let Some(server_uuid) = server_uuid {
                                Self::s3_path(server_uuid, backup_uuid)
                            } else {
                                return Err(anyhow::anyhow!("upload path not found"))
                            }
                        };

                        if let Err(err) = client.delete_object(file_path).await {
                            tracing::error!(server = ?server_uuid, backup = %backup_uuid, "failed to delete S3 backup: {:?}", err);
                        }
                    } else {
                        tracing::warn!(server = ?server_uuid, backup = %backup_uuid, "S3 backup deletion attempted but no S3 configuration found, ignoring");
                    }
                }
                _ => {
                    if let Err(err) = node
                        .api_client(&database)
                        .delete_backups_backup(
                            backup_uuid,
                            &wings_api::backups_backup::delete::RequestBody {
                                adapter: backup_disk.to_wings_adapter(),
                            },
                        )
                        .await
                        && !matches!(err, wings_api::client::ApiHttpError::Http(StatusCode::NOT_FOUND, _))
                    {
                        return Err(err.into());
                    }
                }
            }

            sqlx::query(
                r#"
                UPDATE server_backups
                SET deleted = NOW()
                WHERE server_backups.uuid = $1
                "#,
            )
            .bind(backup_uuid)
            .execute(&mut *transaction)
            .await?;

            transaction.commit().await?;

            Ok(())
        }).await?
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerBackup")]
pub struct ApiServerBackup {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub ignored_files: Vec<compact_str::CompactString>,

    pub is_successful: bool,
    pub is_locked: bool,
    pub is_browsable: bool,
    pub is_streaming: bool,

    pub checksum: Option<String>,
    pub bytes: i64,
    pub files: i64,

    pub completed: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
