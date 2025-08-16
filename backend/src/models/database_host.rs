use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::{
    collections::{BTreeMap, HashMap},
    hash::Hash,
    sync::{Arc, LazyLock},
};
use tokio::sync::Mutex;
use utoipa::ToSchema;

pub enum DatabaseTransaction<'a> {
    Mysql(sqlx::Transaction<'a, sqlx::MySql>),
    Postgres(
        sqlx::Transaction<'a, sqlx::Postgres>,
        Arc<sqlx::Pool<sqlx::Postgres>>,
    ),
}

#[derive(Clone)]
pub enum DatabasePool {
    Mysql(Arc<sqlx::Pool<sqlx::MySql>>),
    Postgres(Arc<sqlx::Pool<sqlx::Postgres>>),
}

type DatabasePoolValue = (std::time::Instant, DatabasePool);
static DATABASE_CLIENTS: LazyLock<Arc<Mutex<HashMap<uuid::Uuid, DatabasePoolValue>>>> =
    LazyLock::new(|| {
        let clients = Arc::new(Mutex::new(HashMap::<uuid::Uuid, DatabasePoolValue>::new()));

        tokio::spawn({
            let clients = Arc::clone(&clients);
            async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(60)).await;

                    let mut clients = clients.lock().await;
                    clients.retain(|_, &mut (last_used, _)| {
                        last_used.elapsed() < std::time::Duration::from_secs(300)
                    });
                }
            }
        });

        clients
    });

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "lowercase")]
#[schema(rename_all = "lowercase")]
#[sqlx(type_name = "database_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DatabaseType {
    Mysql,
    Postgres,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DatabaseHost {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub public: bool,
    pub r#type: DatabaseType,

    pub public_host: Option<String>,
    pub host: String,
    pub public_port: Option<i32>,
    pub port: i32,

    pub username: String,
    pub password: Vec<u8>,

    pub databases: i64,
    pub locations: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for DatabaseHost {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("database_hosts");

        BTreeMap::from([
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.name"), format!("{prefix}name")),
            (format!("{table}.public"), format!("{prefix}public")),
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
            (
                format!(
                    "(SELECT COUNT(*) FROM server_databases WHERE server_databases.database_host_uuid = {table}.uuid)"
                ),
                format!("{prefix}databases"),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM location_database_hosts WHERE location_database_hosts.database_host_uuid = {table}.uuid)"
                ),
                format!("{prefix}locations"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            public: row.get(format!("{prefix}public").as_str()),
            r#type: row.get(format!("{prefix}type").as_str()),
            public_host: row.get(format!("{prefix}public_host").as_str()),
            host: row.get(format!("{prefix}host").as_str()),
            public_port: row.get(format!("{prefix}public_port").as_str()),
            port: row.get(format!("{prefix}port").as_str()),
            username: row.get(format!("{prefix}username").as_str()),
            password: row.get(format!("{prefix}password").as_str()),
            databases: row.get(format!("{prefix}databases").as_str()),
            locations: row.get(format!("{prefix}locations").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl DatabaseHost {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        public: bool,
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
            INSERT INTO database_hosts (name, public, type, public_host, host, public_port, port, username, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING {}
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(name)
        .bind(public)
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

    pub async fn get_connection(
        &self,
        database: &crate::database::Database,
    ) -> Result<DatabasePool, sqlx::Error> {
        let mut clients = DATABASE_CLIENTS.lock().await;

        if let Some((last_used, pool)) = clients.get_mut(&self.uuid) {
            *last_used = std::time::Instant::now();

            return Ok(pool.clone());
        }

        drop(clients);

        let password = database.decrypt(&self.password).unwrap();

        let pool = match self.r#type {
            DatabaseType::Mysql => {
                let options = sqlx::mysql::MySqlConnectOptions::new()
                    .host(&self.host)
                    .port(self.port as u16)
                    .username(&self.username)
                    .password(&password);

                let pool = sqlx::Pool::connect_with(options).await?;
                DatabasePool::Mysql(Arc::new(pool))
            }
            DatabaseType::Postgres => {
                let options = sqlx::postgres::PgConnectOptions::new()
                    .host(&self.host)
                    .port(self.port as u16)
                    .username(&self.username)
                    .password(&password)
                    .database("postgres");

                let pool = sqlx::Pool::connect_with(options).await?;
                DatabasePool::Postgres(Arc::new(pool))
            }
        };

        DATABASE_CLIENTS
            .lock()
            .await
            .insert(self.uuid, (std::time::Instant::now(), pool.clone()));
        Ok(pool)
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
            FROM database_hosts
            WHERE ($1 IS NULL OR database_hosts.name ILIKE '%' || $1 || '%')
            ORDER BY database_hosts.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
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

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM database_hosts
            WHERE database_hosts.uuid = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_location_uuid_uuid(
        database: &crate::database::Database,
        location_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM database_hosts
            JOIN location_database_hosts ON location_database_hosts.database_host_uuid = database_hosts.uuid AND location_database_hosts.location_uuid = $1
            WHERE database_hosts.uuid = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(location_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM database_hosts
            WHERE database_hosts.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiDatabaseHost {
        AdminApiDatabaseHost {
            uuid: self.uuid,
            name: self.name,
            public: self.public,
            r#type: self.r#type,
            public_host: self.public_host,
            host: self.host,
            public_port: self.public_port,
            port: self.port,
            username: self.username,
            databases: self.databases,
            locations: self.locations,
            created: self.created.and_utc(),
        }
    }

    #[inline]
    pub fn into_api_object(self) -> ApiDatabaseHost {
        ApiDatabaseHost {
            uuid: self.uuid,
            name: self.name,
            r#type: self.r#type,
            host: self.public_host.unwrap_or(self.host),
            port: self.public_port.unwrap_or(self.port),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminDatabaseHost")]
pub struct AdminApiDatabaseHost {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub public: bool,
    pub r#type: DatabaseType,

    pub public_host: Option<String>,
    pub host: String,
    pub public_port: Option<i32>,
    pub port: i32,

    pub username: String,

    pub databases: i64,
    pub locations: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "DatabaseHost")]
pub struct ApiDatabaseHost {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub r#type: DatabaseType,

    pub host: String,
    pub port: i32,
}
