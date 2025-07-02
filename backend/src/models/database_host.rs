use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[schema(rename_all = "SCREAMING_SNAKE_CASE")]
#[sqlx(type_name = "database_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DatabaseType {
    Mariadb,
    Postgresql,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DatabaseHost {
    pub id: i32,

    pub name: String,
    pub r#type: DatabaseType,

    pub public_host: Option<String>,
    pub host: String,
    pub public_port: Option<i32>,
    pub port: i32,

    pub username: String,
    pub password: Vec<u8>,

    pub created: NaiveDateTime,
}

impl BaseModel for DatabaseHost {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("database_hosts");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.name", table),
                format!("{}name", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.type", table),
                format!("{}type", prefix.unwrap_or_default()),
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
                format!("{}.public_port", table),
                format!("{}public_port", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.port", table),
                format!("{}port", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.username", table),
                format!("{}username", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.password", table),
                format!("{}password", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            name: row.get(format!("{}name", prefix).as_str()),
            r#type: row.get(format!("{}type", prefix).as_str()),
            public_host: row.get(format!("{}public_host", prefix).as_str()),
            host: row.get(format!("{}host", prefix).as_str()),
            public_port: row.get(format!("{}public_port", prefix).as_str()),
            port: row.get(format!("{}port", prefix).as_str()),
            username: row.get(format!("{}username", prefix).as_str()),
            password: row.get(format!("{}password", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl DatabaseHost {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        r#type: DatabaseType,
        public_host: Option<&str>,
        host: &str,
        public_port: Option<i32>,
        port: i32,
        username: &str,
        password: &str,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO database_hosts (name, type, public_host, host, public_port, port, username, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING {}
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(name)
        .bind(r#type)
        .bind(public_host)
        .bind(host)
        .bind(public_port)
        .bind(port)
        .bind(username)
        .bind(database.encrypt(password).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn save(&self, database: &crate::database::Database) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE database_hosts
            SET
                name = $2,
                type = $3,
                public_host = $4,
                host = $5,
                public_port = $6,
                port = $7,
                username = $8,
                password = $9
            WHERE database_hosts.id = $1
            "#,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(self.r#type)
        .bind(&self.public_host)
        .bind(&self.host)
        .bind(self.public_port)
        .bind(self.port)
        .bind(&self.username)
        .bind(database.encrypt(&self.password).unwrap())
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
    ) -> crate::models::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM database_hosts
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        .unwrap();

        crate::models::Pagination {
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        }
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM database_hosts
            WHERE database_hosts.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM database_hosts
            WHERE database_hosts.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiDatabaseHost {
        AdminApiDatabaseHost {
            id: self.id,
            name: self.name,
            r#type: self.r#type,
            public_host: self.public_host,
            host: self.host,
            public_port: self.public_port,
            port: self.port,
            username: self.username,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "DatabaseHost")]
pub struct AdminApiDatabaseHost {
    pub id: i32,

    pub name: String,
    pub r#type: DatabaseType,

    pub public_host: Option<String>,
    pub host: String,
    pub public_port: Option<i32>,
    pub port: i32,

    pub username: String,

    pub created: NaiveDateTime,
}
