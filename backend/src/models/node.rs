use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub location: super::location::Location,

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

    pub created: NaiveDateTime,
}

impl BaseModel for Node {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("nodes");

        let mut columns = BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.uuid", table),
                format!("{}uuid", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.location_id", table),
                format!("{}location_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.name", table),
                format!("{}name", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.public", table),
                format!("{}public", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.description", table),
                format!("{}description", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.public_url", table),
                format!("{}public_url", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.url", table),
                format!("{}url", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.sftp_host", table),
                format!("{}sftp_host", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.sftp_port", table),
                format!("{}sftp_port", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.maintenance_message", table),
                format!("{}maintenance_message", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.memory", table),
                format!("{}memory", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.disk", table),
                format!("{}disk", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.token_id", table),
                format!("{}token_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.token", table),
                format!("{}token", prefix.unwrap_or_default()),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM servers WHERE servers.node_id = {}.id)",
                    table
                ),
                format!("{}servers", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ]);

        columns.extend(super::location::Location::columns(Some("location_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            uuid: row.get(format!("{}uuid", prefix).as_str()),
            location: super::location::Location::map(Some("location_"), row),
            name: row.get(format!("{}name", prefix).as_str()),
            public: row.get(format!("{}public", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            public_url: row
                .get::<Option<String>, _>(format!("{}public_url", prefix).as_str())
                .map(|url| url.parse().unwrap()),
            url: row
                .get::<String, _>(format!("{}url", prefix).as_str())
                .parse()
                .unwrap(),
            sftp_host: row.get(format!("{}sftp_host", prefix).as_str()),
            sftp_port: row.get(format!("{}sftp_port", prefix).as_str()),
            maintenance_message: row.get(format!("{}maintenance_message", prefix).as_str()),
            memory: row.get(format!("{}memory", prefix).as_str()),
            disk: row.get(format!("{}disk", prefix).as_str()),
            token_id: row.get(format!("{}token_id", prefix).as_str()),
            token: row.get(format!("{}token", prefix).as_str()),
            servers: row.get(format!("{}servers", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl Node {
    pub async fn create(
        database: &crate::database::Database,
        location_id: i32,
        name: &str,
        public: bool,
        description: Option<&str>,
        public_url: Option<&str>,
        url: &str,
        sftp_host: Option<&str>,
        sftp_port: i32,
        memory: i64,
        disk: i64,
    ) -> Result<i32, sqlx::Error> {
        let token_id = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 16);
        let token = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 64);

        let row = sqlx::query(
            r#"
            INSERT INTO nodes (location_id, name, public, description, public_url, url, sftp_host, sftp_port, memory, disk, token_id, token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#
        )
        .bind(location_id)
        .bind(name)
        .bind(public)
        .bind(description)
        .bind(public_url)
        .bind(url)
        .bind(sftp_host)
        .bind(sftp_port)
        .bind(memory)
        .bind(disk)
        .bind(token_id)
        .bind(database.encrypt(token).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(row.get("id"))
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            WHERE nodes.id = $1
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_token_id_token(
        database: &crate::database::Database,
        token_id: &str,
        token: &str,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            WHERE nodes.token_id = $1
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
        ))
        .bind(token_id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        if let Some(node) = row.map(|row| Self::map(None, &row)) {
            if database.decrypt(&node.token).unwrap() == token {
                Some(node)
            } else {
                None
            }
        } else {
            None
        }
    }

    pub async fn by_location_id_with_pagination(
        database: &crate::database::Database,
        location_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            WHERE nodes.location_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
        ))
        .bind(location_id)
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

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
        ))
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

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM nodes
            WHERE nodes.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
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
    pub fn into_admin_api_object(self) -> AdminApiNode {
        AdminApiNode {
            id: self.id,
            uuid: self.uuid,
            location: self.location.into_admin_api_object(),
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
            servers: self.servers,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Node")]
pub struct AdminApiNode {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub location: super::location::AdminApiLocation,

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

    pub servers: i64,

    pub created: NaiveDateTime,
}
