use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "lowercase")]
#[schema(rename_all = "lowercase")]
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

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for DatabaseHost {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("database_hosts");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.name"), format!("{prefix}name")),
            (format!("{table}.type"), format!("{prefix}type")),
            (
                format!("{table}.public_host"),
                format!("{prefix}public_host"),
            ),
            (format!("{table}.host"), format!("{prefix}host")),
            (
                format!("{table}.public_port"),
                format!("{prefix}public_port"),
            ),
            (format!("{table}.port"), format!("{prefix}port")),
            (format!("{table}.username"), format!("{prefix}username")),
            (format!("{table}.password"), format!("{prefix}password")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            r#type: row.get(format!("{prefix}type").as_str()),
            public_host: row.get(format!("{prefix}public_host").as_str()),
            host: row.get(format!("{prefix}host").as_str()),
            public_port: row.get(format!("{prefix}public_port").as_str()),
            port: row.get(format!("{prefix}port").as_str()),
            username: row.get(format!("{prefix}username").as_str()),
            password: row.get(format!("{prefix}password").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
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
            created: self.created.and_utc(),
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

    pub created: chrono::DateTime<chrono::Utc>,
}
