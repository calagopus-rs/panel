use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

pub type GetNode = crate::extract::ConsumingExtension<Node>;

#[derive(Serialize, Deserialize, Clone)]
pub struct Node {
    pub uuid: uuid::Uuid,
    pub location: super::location::Location,
    pub backup_configuration: Option<Box<super::backup_configurations::BackupConfiguration>>,

    pub name: String,
    pub public: bool,
    pub description: Option<String>,

    pub public_url: Option<reqwest::Url>,
    pub url: reqwest::Url,
    pub sftp_host: Option<String>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub token_id: String,
    pub token: Vec<u8>,

    pub servers: i64,
    pub outgoing_transfers: i64,
    pub incoming_transfers: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Node {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            ("nodes.uuid", format!("{prefix}uuid")),
            ("nodes.name", format!("{prefix}name")),
            ("nodes.public", format!("{prefix}public")),
            ("nodes.description", format!("{prefix}description")),
            ("nodes.public_url", format!("{prefix}public_url")),
            ("nodes.url", format!("{prefix}url")),
            ("nodes.sftp_host", format!("{prefix}sftp_host")),
            ("nodes.sftp_port", format!("{prefix}sftp_port")),
            (
                "nodes.maintenance_message",
                format!("{prefix}maintenance_message"),
            ),
            ("nodes.memory", format!("{prefix}memory")),
            ("nodes.disk", format!("{prefix}disk")),
            ("nodes.token_id", format!("{prefix}token_id")),
            ("nodes.token", format!("{prefix}token")),
            (
                "(SELECT COUNT(*) FROM servers WHERE servers.node_uuid = nodes.uuid)",
                format!("{prefix}servers"),
            ),
            (
                "(SELECT COUNT(*) FROM servers WHERE servers.node_uuid = nodes.uuid AND servers.destination_node_uuid IS NOT NULL)",
                format!("{prefix}outgoing_transfers"),
            ),
            (
                "(SELECT COUNT(*) FROM servers WHERE servers.destination_node_uuid = nodes.uuid)",
                format!("{prefix}incoming_transfers"),
            ),
            ("nodes.created", format!("{prefix}created")),
        ]);

        columns.extend(super::location::Location::columns(Some("location_")));
        columns.extend(
            super::backup_configurations::BackupConfiguration::node_columns(Some(
                "node_backup_configuration_",
            )),
        );

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            location: super::location::Location::map(Some("location_"), row),
            backup_configuration: if row
                .try_get::<uuid::Uuid, _>(format!("{prefix}backup_configuration_uuid").as_str())
                .is_ok()
            {
                Some(Box::new(
                    super::backup_configurations::BackupConfiguration::map(
                        Some("node_backup_configuration_"),
                        row,
                    ),
                ))
            } else {
                None
            },
            name: row.get(format!("{prefix}name").as_str()),
            public: row.get(format!("{prefix}public").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            public_url: row
                .get::<Option<String>, _>(format!("{prefix}public_url").as_str())
                .map(|url| url.parse().unwrap()),
            url: row
                .get::<String, _>(format!("{prefix}url").as_str())
                .parse()
                .unwrap(),
            sftp_host: row.get(format!("{prefix}sftp_host").as_str()),
            sftp_port: row.get(format!("{prefix}sftp_port").as_str()),
            maintenance_message: row.get(format!("{prefix}maintenance_message").as_str()),
            memory: row.get(format!("{prefix}memory").as_str()),
            disk: row.get(format!("{prefix}disk").as_str()),
            token_id: row.get(format!("{prefix}token_id").as_str()),
            token: row.get(format!("{prefix}token").as_str()),
            servers: row.get(format!("{prefix}servers").as_str()),
            outgoing_transfers: row.get(format!("{prefix}outgoing_transfers").as_str()),
            incoming_transfers: row.get(format!("{prefix}incoming_transfers").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
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
    ) -> Result<uuid::Uuid, sqlx::Error> {
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
        .bind(database.encrypt(token).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(row.get("uuid"))
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            LEFT JOIN backup_configurations node_backup_configurations ON node_backup_configurations.uuid = nodes.backup_configuration_uuid
            WHERE nodes.uuid = $1
            "#,
            Self::columns_sql(None),
            super::location::Location::columns_sql(Some("location_")),
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_token_id_token(
        database: &crate::database::Database,
        token_id: &str,
        token: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            LEFT JOIN backup_configurations node_backup_configurations ON node_backup_configurations.uuid = nodes.backup_configuration_uuid
            WHERE nodes.token_id = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(token_id)
        .fetch_optional(database.read())
        .await?;

        Ok(if let Some(node) = row.map(|row| Self::map(None, &row)) {
            if constant_time_eq::constant_time_eq(
                database.decrypt(&node.token).unwrap().as_bytes(),
                token.as_bytes(),
            ) {
                Some(node)
            } else {
                None
            }
        } else {
            None
        })
    }

    pub async fn by_location_uuid_with_pagination(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            LEFT JOIN backup_configurations node_backup_configurations ON node_backup_configurations.uuid = nodes.backup_configuration_uuid
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn by_backup_configuration_uuid_with_pagination(
        database: &crate::database::Database,
        backup_configuration_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            LEFT JOIN backup_configurations node_backup_configurations ON node_backup_configurations.uuid = nodes.backup_configuration_uuid
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.uuid = nodes.location_uuid
            LEFT JOIN backup_configurations location_backup_configurations ON location_backup_configurations.uuid = locations.backup_configuration_uuid
            LEFT JOIN backup_configurations node_backup_configurations ON node_backup_configurations.uuid = nodes.backup_configuration_uuid
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM nodes
            WHERE nodes.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn reset_token(
        &self,
        database: &crate::database::Database,
    ) -> Result<(String, String), sqlx::Error> {
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
        .bind(database.encrypt(&token).unwrap())
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
            database.decrypt(&self.token).unwrap(),
        )
    }

    #[inline]
    pub fn create_jwt<T: Serialize>(
        &self,
        database: &crate::database::Database,
        jwt: &crate::jwt::Jwt,
        payload: &T,
    ) -> Result<String, jwt::Error> {
        jwt.create_custom(database.decrypt(&self.token).unwrap().as_bytes(), payload)
    }

    #[inline]
    pub fn into_admin_api_object(self, database: &crate::database::Database) -> AdminApiNode {
        AdminApiNode {
            uuid: self.uuid,
            location: self.location.into_admin_api_object(database),
            backup_configuration: self
                .backup_configuration
                .map(|backup_configuration| backup_configuration.into_admin_api_object(database)),
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
            token: database.decrypt(&self.token).unwrap(),
            servers: self.servers,
            outgoing_transfers: self.outgoing_transfers,
            incoming_transfers: self.incoming_transfers,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Node")]
pub struct AdminApiNode {
    pub uuid: uuid::Uuid,
    pub location: super::location::AdminApiLocation,
    pub backup_configuration: Option<super::backup_configurations::AdminApiBackupConfiguration>,

    pub name: String,
    pub public: bool,
    pub description: Option<String>,

    #[schema(format = "uri")]
    pub public_url: Option<String>,
    #[schema(format = "uri")]
    pub url: String,
    pub sftp_host: Option<String>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub token_id: String,
    pub token: String,

    pub servers: i64,
    pub outgoing_transfers: i64,
    pub incoming_transfers: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
