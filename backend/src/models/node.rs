use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct Node {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub location: super::location::Location,
    pub database_host: Option<super::database_host::DatabaseHost>,

    pub name: String,
    pub public: bool,
    pub description: Option<String>,

    pub public_host: Option<String>,
    pub host: String,
    pub ssl: bool,
    pub sftp_host: Option<String>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub token_id: String,
    pub token: String,

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
                format!("{}.public_host", table),
                format!("{}public_host", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.host", table),
                format!("{}host", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.ssl", table),
                format!("{}ssl", prefix.unwrap_or_default()),
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
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ]);

        columns.extend(super::location::Location::columns(Some("location_"), None));
        columns.extend(super::database_host::DatabaseHost::columns(
            Some("database_host_"),
            None,
        ));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            uuid: row.get(format!("{}uuid", prefix).as_str()),
            location: super::location::Location::map(Some("location_"), row),
            database_host: if let Ok(_) =
                row.try_get::<i32, _>(format!("{}database_host_id", prefix).as_str())
            {
                Some(super::database_host::DatabaseHost::map(
                    Some("database_host_"),
                    row,
                ))
            } else {
                None
            },
            name: row.get(format!("{}name", prefix).as_str()),
            public: row.get(format!("{}public", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            public_host: row.get(format!("{}public_host", prefix).as_str()),
            host: row.get(format!("{}host", prefix).as_str()),
            ssl: row.get(format!("{}ssl", prefix).as_str()),
            sftp_host: row.get(format!("{}sftp_host", prefix).as_str()),
            sftp_port: row.get(format!("{}sftp_port", prefix).as_str()),
            maintenance_message: row.get(format!("{}maintenance_message", prefix).as_str()),
            memory: row.get(format!("{}memory", prefix).as_str()),
            disk: row.get(format!("{}disk", prefix).as_str()),
            token_id: row.get(format!("{}token_id", prefix).as_str()),
            token: row.get(format!("{}token", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl Node {
    pub async fn new(
        database: &crate::database::Database,
        location_id: i32,
        database_host_id: Option<i32>,
        name: &str,
        public: bool,
        description: Option<&str>,
        public_host: Option<&str>,
        host: &str,
        ssl: bool,
        sftp_port: i32,
        memory: i64,
        disk: i64,
    ) -> i32 {
        let mut rng = rand::rng();
        let token_id = rand::distr::Alphanumeric.sample_string(&mut rng, 16);
        let token = rand::distr::Alphanumeric.sample_string(&mut rng, 64);

        let row = sqlx::query(
            r#"
            INSERT INTO nodes (location_id, database_host_id, name, public, description, public_host, host, ssl, sftp_port, memory, disk, token_id, token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            "#
        )
        .bind(location_id)
        .bind(database_host_id)
        .bind(name)
        .bind(public)
        .bind(description)
        .bind(public_host)
        .bind(host)
        .bind(ssl)
        .bind(sftp_port)
        .bind(memory)
        .bind(disk)
        .bind(token_id)
        .bind(database.encrypt(token).unwrap())
        .fetch_one(database.write())
        .await
        .unwrap();

        row.get("id")
    }

    pub async fn save(&self, database: &crate::database::Database) {
        sqlx::query(
            r#"
            UPDATE nodes
            SET
                location_id = $2,
                database_host_id = $3,
                name = $4,
                public = $5,
                description = $6,
                public_host = $7,
                host = $8,
                ssl = $9,
                sftp_port = $10,
                memory = $11,
                disk = $12,
                maintenance_message = $13,
                token_id = $14,
                token = $15
            WHERE nodes.id = $1
            "#,
        )
        .bind(self.id)
        .bind(self.location.id)
        .bind(self.database_host.as_ref().map(|host| host.id))
        .bind(&self.name)
        .bind(self.public)
        .bind(&self.description)
        .bind(&self.public_host)
        .bind(&self.host)
        .bind(self.ssl)
        .bind(self.sftp_port)
        .bind(self.memory)
        .bind(self.disk)
        .bind(&self.maintenance_message)
        .bind(&self.token_id)
        .bind(&self.token)
        .execute(database.write())
        .await
        .unwrap();
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}, {}
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN database_hosts ON database_hosts.id = nodes.database_host_id
            WHERE nodes.id = $1
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
            super::database_host::DatabaseHost::columns_sql(Some("database_host_"), None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
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
            SELECT {}, {}, {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN database_hosts ON database_hosts.id = nodes.database_host_id
            WHERE nodes.location_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
            super::database_host::DatabaseHost::columns_sql(Some("database_host_"), None)
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
            SELECT {}, {}, {}, COUNT(*) OVER() AS total_count
            FROM nodes
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN database_hosts ON database_hosts.id = nodes.database_host_id
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None),
            super::location::Location::columns_sql(Some("location_"), None),
            super::database_host::DatabaseHost::columns_sql(Some("database_host_"), None)
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
    pub fn into_admin_api_object(self) -> AdminApiNode {
        AdminApiNode {
            id: self.id,
            uuid: self.uuid,
            location: self.location.into_admin_api_object(),
            database_host: self.database_host.map(|host| host.into_admin_api_object()),
            name: self.name,
            public: self.public,
            description: self.description,
            public_host: self.public_host,
            host: self.host,
            ssl: self.ssl,
            sftp_host: self.sftp_host,
            sftp_port: self.sftp_port,
            maintenance_message: self.maintenance_message,
            memory: self.memory,
            disk: self.disk,
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
    pub database_host: Option<super::database_host::AdminApiDatabaseHost>,

    pub name: String,
    pub public: bool,
    pub description: Option<String>,

    pub public_host: Option<String>,
    pub host: String,
    pub ssl: bool,
    pub sftp_host: Option<String>,
    pub sftp_port: i32,

    pub maintenance_message: Option<String>,

    pub memory: i64,
    pub disk: i64,

    pub created: NaiveDateTime,
}
