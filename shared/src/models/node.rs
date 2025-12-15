use crate::prelude::*;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

pub type GetNode = crate::extract::ConsumingExtension<Node>;

#[derive(Serialize, Deserialize, Clone)]
pub struct Node {
    pub uuid: uuid::Uuid,
    pub location: super::location::Location,
    pub backup_configuration: Option<Fetchable<super::backup_configurations::BackupConfiguration>>,

    pub name: compact_str::CompactString,
    pub public: bool,
    pub description: Option<compact_str::CompactString>,

    pub public_url: Option<reqwest::Url>,
    pub url: reqwest::Url,
    pub sftp_host: Option<compact_str::CompactString>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub token_id: compact_str::CompactString,
    pub token: Vec<u8>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Node {
    const NAME: &'static str = "node";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            ("nodes.uuid", compact_str::format_compact!("{prefix}uuid")),
            (
                "nodes.backup_configuration_uuid",
                compact_str::format_compact!("{prefix}node_backup_configuration_uuid"),
            ),
            ("nodes.name", compact_str::format_compact!("{prefix}name")),
            (
                "nodes.public",
                compact_str::format_compact!("{prefix}public"),
            ),
            (
                "nodes.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "nodes.public_url",
                compact_str::format_compact!("{prefix}public_url"),
            ),
            ("nodes.url", compact_str::format_compact!("{prefix}url")),
            (
                "nodes.sftp_host",
                compact_str::format_compact!("{prefix}sftp_host"),
            ),
            (
                "nodes.sftp_port",
                compact_str::format_compact!("{prefix}sftp_port"),
            ),
            (
                "nodes.maintenance_message",
                compact_str::format_compact!("{prefix}maintenance_message"),
            ),
            (
                "nodes.memory",
                compact_str::format_compact!("{prefix}memory"),
            ),
            ("nodes.disk", compact_str::format_compact!("{prefix}disk")),
            (
                "nodes.token_id",
                compact_str::format_compact!("{prefix}token_id"),
            ),
            ("nodes.token", compact_str::format_compact!("{prefix}token")),
            (
                "nodes.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ]);

        columns.extend(super::location::Location::columns(Some("location_")));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            location: super::location::Location::map(Some("location_"), row)?,
            backup_configuration:
                super::backup_configurations::BackupConfiguration::get_fetchable_from_row(
                    row,
                    compact_str::format_compact!("{prefix}node_backup_configuration_uuid"),
                ),
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            public: row.try_get(compact_str::format_compact!("{prefix}public").as_str())?,
            description: row
                .try_get(compact_str::format_compact!("{prefix}description").as_str())?,
            public_url: row
                .try_get::<Option<String>, _>(
                    compact_str::format_compact!("{prefix}public_url").as_str(),
                )?
                .try_map(|url| url.parse())
                .map_err(anyhow::Error::new)?,
            url: row
                .try_get::<String, _>(compact_str::format_compact!("{prefix}url").as_str())?
                .parse()
                .map_err(anyhow::Error::new)?,
            sftp_host: row.try_get(compact_str::format_compact!("{prefix}sftp_host").as_str())?,
            sftp_port: row.try_get(compact_str::format_compact!("{prefix}sftp_port").as_str())?,
            maintenance_message: row
                .try_get(compact_str::format_compact!("{prefix}maintenance_message").as_str())?,
            memory: row.try_get(compact_str::format_compact!("{prefix}memory").as_str())?,
            disk: row.try_get(compact_str::format_compact!("{prefix}disk").as_str())?,
            token_id: row.try_get(compact_str::format_compact!("{prefix}token_id").as_str())?,
            token: row.try_get(compact_str::format_compact!("{prefix}token").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl Node {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        backup_configuration_uuid: Option<uuid::Uuid>,
        name: &str,
        public: bool,
        description: Option<&str>,
        public_url: Option<&str>,
        url: &str,
        sftp_host: Option<&str>,
        sftp_port: i32,
        maintenance_message: Option<&str>,
        memory: i64,
        disk: i64,
    ) -> Result<uuid::Uuid, crate::database::DatabaseError> {
        let token_id = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 16);
        let token = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 64);

        let row = sqlx::query(
            r#"
            INSERT INTO nodes (location_uuid, backup_configuration_uuid, name, public, description, public_url, url, sftp_host, sftp_port, maintenance_message, memory, disk, token_id, token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING uuid
            "#
        )
        .bind(location_uuid)
        .bind(backup_configuration_uuid)
        .bind(name)
        .bind(public)
        .bind(description)
        .bind(public_url)
        .bind(url)
        .bind(sftp_host)
        .bind(sftp_port)
        .bind(maintenance_message)
        .bind(memory)
        .bind(disk)
        .bind(token_id)
        .bind(database.encrypt(token).await?)
        .fetch_one(database.write())
        .await?;

        Ok(row.get("uuid"))
    }

    pub async fn by_token_id_token_cached(
        database: &crate::database::Database,
        token_id: &str,
        token: &str,
    ) -> Result<Option<Self>, anyhow::Error> {
        database
            .cache
            .cached(&format!("node::token::{token_id}.{token}"), 10, || async {
                let row = sqlx::query(&format!(
                    r#"
                    SELECT {}
                    FROM nodes
                    JOIN locations ON locations.uuid = nodes.location_uuid
                    WHERE nodes.token_id = $1
                    "#,
                    Self::columns_sql(None)
                ))
                .bind(token_id)
                .fetch_optional(database.read())
                .await?;

                Ok::<_, anyhow::Error>(
                    if let Some(node) = row.try_map(|row| Self::map(None, &row))? {
                        if constant_time_eq::constant_time_eq(
                            database.decrypt(node.token.clone()).await?.as_bytes(),
                            token.as_bytes(),
                        ) {
                            Some(node)
                        } else {
                            None
                        }
                    } else {
                        None
                    },
                )
            })
            .await
    }

    pub async fn by_location_uuid_with_pagination(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            WHERE nodes.location_uuid = $1 AND ($2 IS NULL OR nodes.name ILIKE '%' || $2 || '%')
            ORDER BY nodes.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(location_uuid)
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

    pub async fn by_backup_configuration_uuid_with_pagination(
        database: &crate::database::Database,
        backup_configuration_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            WHERE nodes.backup_configuration_uuid = $1 AND ($2 IS NULL OR nodes.name ILIKE '%' || $2 || '%')
            ORDER BY nodes.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(backup_configuration_uuid)
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
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            WHERE $1 IS NULL OR nodes.name ILIKE '%' || $1 || '%'
            ORDER BY nodes.created
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

    pub async fn count_by_location_uuid(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM nodes
            WHERE nodes.location_uuid = $1
            "#,
        )
        .bind(location_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn cached_configuration(
        &self,
        database: &crate::database::Database,
    ) -> Result<wings_api::Config, anyhow::Error> {
        database
            .cache
            .cached(
                &format!("node::{}::configuration", self.uuid),
                120,
                || async { self.api_client(database).get_system_config().await },
            )
            .await
    }

    pub async fn reset_token(
        &self,
        database: &crate::database::Database,
    ) -> Result<(String, String), anyhow::Error> {
        let token_id = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 16);
        let token = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 64);

        sqlx::query(
            r#"
            UPDATE nodes
            SET token_id = $2, token = $3
            WHERE nodes.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .bind(&token_id)
        .bind(database.encrypt(token.clone()).await?)
        .execute(database.write())
        .await?;

        Ok((token_id, token))
    }

    #[inline]
    pub fn public_url(&self) -> reqwest::Url {
        self.public_url.clone().unwrap_or(self.url.clone())
    }

    #[inline]
    pub fn api_client(
        &self,
        database: &crate::database::Database,
    ) -> wings_api::client::WingsClient {
        wings_api::client::WingsClient::new(
            self.url.to_string(),
            database.decrypt_sync(&self.token).unwrap().into(),
        )
    }

    #[inline]
    pub fn create_jwt<T: Serialize>(
        &self,
        database: &crate::database::Database,
        jwt: &crate::jwt::Jwt,
        payload: &T,
    ) -> Result<String, jwt::Error> {
        jwt.create_custom(
            database.decrypt_sync(&self.token).unwrap().as_bytes(),
            payload,
        )
    }

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiNode, anyhow::Error> {
        let (location, backup_configuration) =
            tokio::join!(self.location.into_admin_api_object(database), async {
                if let Some(backup_configuration) = self.backup_configuration {
                    if let Ok(backup_configuration) =
                        backup_configuration.fetch_cached(database).await
                    {
                        backup_configuration
                            .into_admin_api_object(database)
                            .await
                            .ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            });

        Ok(AdminApiNode {
            uuid: self.uuid,
            location,
            backup_configuration,
            name: self.name,
            public: self.public,
            description: self.description,
            public_url: self.public_url.map(|url| url.to_string()),
            url: self.url.to_string(),
            sftp_host: self.sftp_host,
            sftp_port: self.sftp_port,
            maintenance_message: self.maintenance_message,
            memory: self.memory,
            disk: self.disk,
            token_id: self.token_id,
            token: database.decrypt(self.token).await?,
            created: self.created.and_utc(),
        })
    }
}

#[async_trait::async_trait]
impl ByUuid for Node {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            WHERE nodes.uuid = $1
            "#,
            Self::columns_sql(None),
            super::location::Location::columns_sql(Some("location_")),
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[async_trait::async_trait]
impl DeletableModel for Node {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<Node>> =
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
            DELETE FROM nodes
            WHERE nodes.uuid = $1
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
#[schema(title = "Node")]
pub struct AdminApiNode {
    pub uuid: uuid::Uuid,
    pub location: super::location::AdminApiLocation,
    pub backup_configuration: Option<super::backup_configurations::AdminApiBackupConfiguration>,

    pub name: compact_str::CompactString,
    pub public: bool,
    pub description: Option<compact_str::CompactString>,

    #[schema(format = "uri")]
    pub public_url: Option<String>,
    #[schema(format = "uri")]
    pub url: String,
    pub sftp_host: Option<compact_str::CompactString>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub token_id: compact_str::CompactString,
    pub token: compact_str::CompactString,

    pub created: chrono::DateTime<chrono::Utc>,
}
