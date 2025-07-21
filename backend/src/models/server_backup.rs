use super::BaseModel;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::{collections::BTreeMap, sync::Arc};
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

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerBackup {
    pub id: i32,
    pub server_id: i32,
    pub uuid: uuid::Uuid,

    pub name: String,
    pub successful: bool,
    pub locked: bool,

    pub ignored_files: Vec<String>,
    pub checksum: Option<String>,
    pub bytes: i64,

    pub disk: BackupDisk,
    pub upload_id: Option<String>,

    pub completed: Option<chrono::NaiveDateTime>,
    pub deleted: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerBackup {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_backups");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.server_id"), format!("{prefix}server_id")),
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.name"), format!("{prefix}name")),
            (format!("{table}.successful"), format!("{prefix}successful")),
            (format!("{table}.locked"), format!("{prefix}locked")),
            (
                format!("{table}.ignored_files"),
                format!("{prefix}ignored_files"),
            ),
            (format!("{table}.checksum"), format!("{prefix}checksum")),
            (format!("{table}.bytes"), format!("{prefix}bytes")),
            (format!("{table}.disk"), format!("{prefix}disk")),
            (format!("{table}.upload_id"), format!("{prefix}upload_id")),
            (format!("{table}.completed"), format!("{prefix}completed")),
            (format!("{table}.deleted"), format!("{prefix}deleted")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            server_id: row.get(format!("{prefix}server_id").as_str()),
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            successful: row.get(format!("{prefix}successful").as_str()),
            locked: row.get(format!("{prefix}locked").as_str()),
            ignored_files: row.get(format!("{prefix}ignored_files").as_str()),
            checksum: row.get(format!("{prefix}checksum").as_str()),
            bytes: row.get(format!("{prefix}bytes").as_str()),
            disk: row.get(format!("{prefix}disk").as_str()),
            upload_id: row.get(format!("{prefix}upload_id").as_str()),
            completed: row.get(format!("{prefix}completed").as_str()),
            deleted: row.get(format!("{prefix}deleted").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerBackup {
    pub async fn create(
        database: &Arc<crate::database::Database>,
        server: super::server::Server,
        name: &str,
        ignored_files: Vec<String>,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_backups (server_id, name, ignored_files, bytes, disk) VALUES ($1, $2, $3, $4, $5)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server.id)
        .bind(name)
        .bind(&ignored_files)
        .bind(0i64)
        .bind(server.node.location.backup_disk)
        .fetch_one(database.write())
        .await?;

        tokio::spawn({
            let uuid = row.get::<uuid::Uuid, _>("uuid");
            let database = Arc::clone(database);

            async move {
                tracing::debug!(backup = %uuid, "creating server backup");

                let adapter = match server.node.location.backup_disk {
                    BackupDisk::Local => wings_api::BackupAdapter::Wings,
                    BackupDisk::S3 => wings_api::BackupAdapter::S3,
                    BackupDisk::DdupBak => wings_api::BackupAdapter::DdupBak,
                    BackupDisk::Btrfs => wings_api::BackupAdapter::Btrfs,
                    BackupDisk::Zfs => wings_api::BackupAdapter::Zfs,
                    BackupDisk::Restic => wings_api::BackupAdapter::Restic,
                };

                if server.node.location.backup_disk == BackupDisk::Restic {
                    server
                        .node
                        .api_client(&database)
                        .post_servers_server_sync(server.uuid)
                        .await
                        .ok();
                }

                if let Err(err) = server
                    .node
                    .api_client(&database)
                    .post_servers_server_backup(
                        server.uuid,
                        &wings_api::servers_server_backup::post::RequestBody {
                            adapter,
                            uuid,
                            ignore: ignored_files.join("\n"),
                        },
                    )
                    .await
                {
                    tracing::error!(backup = %uuid, "failed to create server backup: {:#?}", err);

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
                        tracing::error!(backup = %uuid, "failed to update server backup status: {:#?}", err);
                    }
                }
            }
        });

        Ok(Self::map(None, &row))
    }

    pub async fn by_server_id_uuid(
        database: &crate::database::Database,
        server_id: i32,
        uuid: uuid::Uuid,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            WHERE server_backups.server_id = $1 AND server_backups.uuid = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
        .bind(uuid)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_node_id_uuid(
        database: &crate::database::Database,
        node_id: i32,
        uuid: uuid::Uuid,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_backups
            JOIN servers ON servers.id = server_backups.server_id
            WHERE servers.node_id = $1 AND server_backups.uuid = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(node_id)
        .bind(uuid)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_backups
            WHERE server_backups.server_id = $1 AND server_backups.deleted IS NULL
            ORDER BY server_backups.id ASC
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        .unwrap();

        super::Pagination {
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        }
    }

    pub async fn count_by_server_id(database: &crate::database::Database, server_id: i32) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_backups
            WHERE server_backups.server_id = $1 AND server_backups.deleted IS NULL
            "#,
        )
        .bind(server_id)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn restore(
        &self,
        database: &crate::database::Database,
        server: super::server::Server,
        truncate_directory: bool,
    ) -> Result<(), s3::error::S3Error> {
        if self.disk == BackupDisk::Restic {
            server
                .node
                .api_client(&database)
                .post_servers_server_sync(server.uuid)
                .await
                .ok();
        }

        if let Err((status, error)) = server
            .node
            .api_client(database)
            .post_servers_server_backup_backup_restore(
                server.uuid,
                self.uuid,
                &wings_api::servers_server_backup_backup_restore::post::RequestBody {
                    adapter: match self.disk {
                        BackupDisk::Local => wings_api::BackupAdapter::Wings,
                        BackupDisk::S3 => wings_api::BackupAdapter::S3,
                        BackupDisk::DdupBak => wings_api::BackupAdapter::DdupBak,
                        BackupDisk::Btrfs => wings_api::BackupAdapter::Btrfs,
                        BackupDisk::Zfs => wings_api::BackupAdapter::Zfs,
                        BackupDisk::Restic => wings_api::BackupAdapter::Restic,
                    },
                    download_url: match self.disk {
                        BackupDisk::S3 => {
                            if let Some(mut s3_configuration) =
                                server.node.location.backup_configs.s3
                            {
                                s3_configuration.decrypt(database);

                                let client = s3_configuration.into_client()?;
                                let file_path = Self::s3_path(server.uuid, self.uuid);

                                Some(client.presign_get(file_path, 60 * 60, None).await?)
                            } else {
                                None
                            }
                        }
                        _ => None,
                    },
                    truncate_directory,
                },
            )
            .await
        {
            return Err(s3::error::S3Error::HttpFailWithBody(
                status.as_u16(),
                error.error,
            ));
        }

        Ok(())
    }

    pub async fn delete(
        &self,
        database: &crate::database::Database,
        server: super::server::Server,
    ) -> Result<(), sqlx::Error> {
        match self.disk {
            BackupDisk::S3 => {
                if let Some(mut s3_configuration) = server.node.location.backup_configs.s3 {
                    s3_configuration.decrypt(database);

                    let client = s3_configuration
                        .into_client()
                        .map_err(|err| sqlx::Error::Io(std::io::Error::other(err)))?;
                    let file_path = Self::s3_path(server.uuid, self.uuid);

                    if let Err(err) = client.delete_object(file_path).await {
                        tracing::error!(server = %server.uuid, backup = %self.uuid, "failed to delete S3 backup: {:#?}", err);
                    }
                } else {
                    tracing::warn!(server = %server.uuid, backup = %self.uuid, "S3 backup deletion attempted but no S3 configuration found, ignoring");
                }
            }
            disk => {
                if disk == BackupDisk::Restic {
                    server
                        .node
                        .api_client(&database)
                        .post_servers_server_sync(server.uuid)
                        .await
                        .ok();
                }

                if let Err((status, error)) = server
                    .node
                    .api_client(database)
                    .delete_servers_server_backup_backup(server.uuid, self.uuid)
                    .await
                {
                    if status != StatusCode::NOT_FOUND {
                        return Err(sqlx::Error::Io(std::io::Error::other(error.error)));
                    }
                }
            }
        }

        sqlx::query(
            r#"
            DELETE FROM server_backups
            WHERE server_backups.id = $1
            "#,
        )
        .bind(self.id)
        .execute(database.write())
        .await?;

        Ok(())
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
            is_browsable: matches!(
                self.disk,
                BackupDisk::Local
                    | BackupDisk::DdupBak
                    | BackupDisk::Btrfs
                    | BackupDisk::Zfs
                    | BackupDisk::Restic
            ),
            checksum: self.checksum,
            bytes: self.bytes,
            completed: self.completed.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerBackup")]
pub struct ApiServerBackup {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub ignored_files: Vec<String>,

    pub is_successful: bool,
    pub is_locked: bool,
    pub is_browsable: bool,
    pub checksum: Option<String>,
    pub bytes: i64,

    pub completed: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
