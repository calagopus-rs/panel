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
    pub server_uuid: Option<uuid::Uuid>,
    pub node_uuid: uuid::Uuid,

    pub name: String,
    pub successful: bool,
    pub locked: bool,

    pub ignored_files: Vec<String>,
    pub checksum: Option<String>,
    pub bytes: i64,
    pub files: i64,

    pub disk: BackupDisk,
    pub upload_id: Option<String>,
    pub upload_path: Option<String>,

    pub completed: Option<chrono::NaiveDateTime>,
    pub deleted: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerBackup {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("server_backups.uuid", format!("{prefix}uuid")),
            ("server_backups.server_uuid", format!("{prefix}server_uuid")),
            ("server_backups.node_uuid", format!("{prefix}node_uuid")),
            ("server_backups.name", format!("{prefix}name")),
            ("server_backups.successful", format!("{prefix}successful")),
            ("server_backups.locked", format!("{prefix}locked")),
            (
                "server_backups.ignored_files",
                format!("{prefix}ignored_files"),
            ),
            ("server_backups.checksum", format!("{prefix}checksum")),
            ("server_backups.bytes", format!("{prefix}bytes")),
            ("server_backups.files", format!("{prefix}files")),
            ("server_backups.disk", format!("{prefix}disk")),
            ("server_backups.upload_id", format!("{prefix}upload_id")),
            ("server_backups.upload_path", format!("{prefix}upload_path")),
            ("server_backups.completed", format!("{prefix}completed")),
            ("server_backups.deleted", format!("{prefix}deleted")),
            ("server_backups.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            server_uuid: row.get(format!("{prefix}server_uuid").as_str()),
            node_uuid: row.get(format!("{prefix}node_uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            successful: row.get(format!("{prefix}successful").as_str()),
            locked: row.get(format!("{prefix}locked").as_str()),
            ignored_files: row.get(format!("{prefix}ignored_files").as_str()),
            checksum: row.get(format!("{prefix}checksum").as_str()),
            bytes: row.get(format!("{prefix}bytes").as_str()),
            files: row.get(format!("{prefix}files").as_str()),
            disk: row.get(format!("{prefix}disk").as_str()),
            upload_id: row.get(format!("{prefix}upload_id").as_str()),
            upload_path: row.get(format!("{prefix}upload_path").as_str()),
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
            INSERT INTO server_backups (server_uuid, node_uuid, name, ignored_files, bytes, disk) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(server.uuid)
        .bind(server.node.uuid)
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

                if let Err(err) = server
                    .node
                    .api_client(&database)
                    .post_servers_server_backup(
                        server.uuid,
                        &wings_api::servers_server_backup::post::RequestBody {
                            adapter: server.node.location.backup_disk.to_wings_adapter(),
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

    pub async fn create_raw(
        database: &Arc<crate::database::Database>,
        server: &super::server::Server,
        name: &str,
        ignored_files: Vec<String>,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_backups (server_uuid, node_uuid, name, ignored_files, bytes, disk) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(server.uuid)
        .bind(server.node.uuid)
        .bind(name)
        .bind(&ignored_files)
        .bind(0i64)
        .bind(server.node.location.backup_disk)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
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

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_node_uuid_uuid(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
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

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn by_detached_node_uuid_with_pagination(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn all_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
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

        Ok(rows.into_iter().map(|row| Self::map(None, &row)).collect())
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
        &self,
        database: &crate::database::Database,
        server: super::server::Server,
        truncate_directory: bool,
    ) -> Result<(), s3::error::S3Error> {
        if let Err((status, error)) = server
            .node
            .api_client(database)
            .post_servers_server_backup_backup_restore(
                server.uuid,
                self.uuid,
                &wings_api::servers_server_backup_backup_restore::post::RequestBody {
                    adapter: self.disk.to_wings_adapter(),
                    download_url: match self.disk {
                        BackupDisk::S3 => {
                            if let Some(mut s3_configuration) =
                                server.node.location.backup_configs.s3
                            {
                                s3_configuration.decrypt(database);

                                let client = s3_configuration.into_client()?;
                                let file_path = match self.upload_path.as_ref() {
                                    Some(path) => path,
                                    None => &Self::s3_path(server.uuid, self.uuid),
                                };

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
        server: &super::server::Server,
    ) -> Result<(), sqlx::Error> {
        let node = if self.node_uuid == server.node.uuid {
            &server.node
        } else {
            &super::node::Node::by_uuid(database, self.node_uuid)
                .await?
                .ok_or_else(|| sqlx::Error::RowNotFound)?
        };

        match self.disk {
            BackupDisk::S3 => {
                if let Some(mut s3_configuration) = node.location.backup_configs.s3.clone() {
                    s3_configuration.decrypt(database);

                    let client = s3_configuration
                        .into_client()
                        .map_err(|err| sqlx::Error::Io(std::io::Error::other(err)))?;
                    let file_path = match self.upload_path.as_ref() {
                        Some(path) => path,
                        None => &Self::s3_path(server.uuid, self.uuid),
                    };

                    if let Err(err) = client.delete_object(file_path).await {
                        tracing::error!(server = %server.uuid, backup = %self.uuid, "failed to delete S3 backup: {:#?}", err);
                    }
                } else {
                    tracing::warn!(server = %server.uuid, backup = %self.uuid, "S3 backup deletion attempted but no S3 configuration found, ignoring");
                }
            }
            _ => {
                if let Err((status, error)) = node
                    .api_client(database)
                    .delete_backups_backup(
                        self.uuid,
                        &wings_api::backups_backup::delete::RequestBody {
                            adapter: self.disk.to_wings_adapter(),
                        },
                    )
                    .await
                    && status != StatusCode::NOT_FOUND
                {
                    return Err(sqlx::Error::Io(std::io::Error::other(error.error)));
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
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn delete_detached(
        &self,
        database: &crate::database::Database,
        node: super::node::Node,
    ) -> Result<(), sqlx::Error> {
        match self.disk {
            BackupDisk::S3 => {
                if let Some(mut s3_configuration) = node.location.backup_configs.s3 {
                    s3_configuration.decrypt(database);

                    let client = s3_configuration
                        .into_client()
                        .map_err(|err| sqlx::Error::Io(std::io::Error::other(err)))?;
                    let file_path = match self.upload_path.as_ref() {
                        Some(path) => path,
                        None => {
                            return Err(sqlx::Error::Io(std::io::Error::new(
                                std::io::ErrorKind::NotFound,
                                "upload path not found",
                            )));
                        }
                    };

                    if let Err(err) = client.delete_object(file_path).await {
                        tracing::error!(backup = %self.uuid, "failed to delete S3 backup: {:#?}", err);
                    }
                } else {
                    return Err(sqlx::Error::Io(std::io::Error::new(
                        std::io::ErrorKind::NotFound,
                        "S3 configuration not found",
                    )));
                }
            }
            _ => {
                if let Err((status, error)) = node
                    .api_client(database)
                    .delete_backups_backup(
                        self.uuid,
                        &wings_api::backups_backup::delete::RequestBody {
                            adapter: self.disk.to_wings_adapter(),
                        },
                    )
                    .await
                    && status != StatusCode::NOT_FOUND
                {
                    return Err(sqlx::Error::Io(std::io::Error::other(error.error)));
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
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn delete_oldest_by_server_uuid(
        database: &crate::database::Database,
        server: &super::server::Server,
    ) -> Result<(), sqlx::Error> {
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
            let backup = Self::map(None, &row);

            backup.delete(database, server).await
        } else {
            Err(sqlx::Error::RowNotFound)
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
            is_browsable: matches!(
                self.disk,
                BackupDisk::DdupBak | BackupDisk::Btrfs | BackupDisk::Zfs | BackupDisk::Restic
            ),
            is_streaming: matches!(
                self.disk,
                BackupDisk::DdupBak | BackupDisk::Btrfs | BackupDisk::Zfs | BackupDisk::Restic
            ),
            checksum: self.checksum,
            bytes: self.bytes,
            files: self.files,
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
    pub is_streaming: bool,

    pub checksum: Option<String>,
    pub bytes: i64,
    pub files: i64,

    pub completed: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
