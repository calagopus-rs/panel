use super::BaseModel;
use crate::models::database_host::{DatabaseTransaction, DatabaseType};
use rand::distr::SampleString;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, sync::LazyLock};
use utoipa::ToSchema;

pub static DB_NAME_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9_]+$").expect("Failed to compile database name regex")
});

#[derive(Serialize, Deserialize)]
pub struct ServerDatabase {
    pub uuid: uuid::Uuid,
    pub database_host: super::database_host::DatabaseHost,

    pub name: String,
    pub username: String,
    pub password: Vec<u8>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerDatabase {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_databases");

        let mut columns = BTreeMap::from([
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.name"), format!("{prefix}name")),
            (format!("{table}.username"), format!("{prefix}username")),
            (format!("{table}.password"), format!("{prefix}password")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

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
            uuid: row.get(format!("{prefix}uuid").as_str()),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row),
            name: row.get(format!("{prefix}name").as_str()),
            username: row.get(format!("{prefix}username").as_str()),
            password: row.get(format!("{prefix}password").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerDatabase {
    pub async fn create(
        database: &crate::database::Database,
        server: &super::server::Server,
        database_host: &super::database_host::DatabaseHost,
        name: &str,
    ) -> Result<uuid::Uuid, sqlx::Error> {
        let server_id = format!("{:08x}", server.uuid_short);
        let name = format!("s{server_id}_{name}");
        let username = format!(
            "u{}_{}",
            server_id,
            rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 10)
        );
        let password = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 24);

        let transaction: DatabaseTransaction = match database_host.get_connection(database).await? {
            crate::models::database_host::DatabasePool::Mysql(pool) => {
                let mut transaction = pool.begin().await?;

                sqlx::query(&format!(
                    "CREATE USER IF NOT EXISTS '{username}'@'%' IDENTIFIED BY '{password}'"
                ))
                .execute(&mut *transaction)
                .await?;
                sqlx::query(&format!("CREATE DATABASE IF NOT EXISTS `{name}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
                    .execute(&mut *transaction)
                    .await?;
                sqlx::query(&format!(
                    "GRANT ALL PRIVILEGES ON `{name}`.* TO '{username}'@'%' WITH GRANT OPTION"
                ))
                .execute(&mut *transaction)
                .await?;

                DatabaseTransaction::Mysql(transaction)
            }
            crate::models::database_host::DatabasePool::Postgres(pool) => {
                let transaction = pool.begin().await?;

                sqlx::query(&format!(
                    "CREATE USER \"{username}\" WITH PASSWORD '{password}'"
                ))
                .execute(pool.as_ref())
                .await?;
                sqlx::query(&format!(
                    "CREATE DATABASE \"{name}\" WITH OWNER \"{username}\" ENCODING 'UTF8'"
                ))
                .execute(pool.as_ref())
                .await?;

                DatabaseTransaction::Postgres(transaction, pool)
            }
        };

        let row = match sqlx::query(
            r#"
            INSERT INTO server_databases (server_uuid, database_host_uuid, name, username, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING uuid
            "#,
        )
        .bind(server.uuid)
        .bind(database_host.uuid)
        .bind(&name)
        .bind(&username)
        .bind(database.encrypt(&password).unwrap())
        .fetch_one(database.write())
        .await
        {
            Ok(row) => row,
            Err(err) => {
                match transaction {
                    DatabaseTransaction::Mysql(transaction) => {
                        transaction.rollback().await?;
                    }
                    DatabaseTransaction::Postgres(transaction, pool) => {
                        transaction.rollback().await?;

                        let drop_database = format!("DROP DATABASE IF EXISTS \"{name}\"");
                        let drop_user = format!("DROP USER IF EXISTS \"{username}\"");

                        let (_, _) = tokio::join!(
                            sqlx::query(&drop_database).execute(pool.as_ref()),
                            sqlx::query(&drop_user).execute(pool.as_ref())
                        );
                    }
                }

                return Err(err);
            }
        };

        match match transaction {
            DatabaseTransaction::Mysql(transaction) => transaction.commit().await,
            DatabaseTransaction::Postgres(transaction, _) => transaction.commit().await,
        } {
            Ok(_) => {}
            Err(err) => {
                sqlx::query(
                    r#"
                    DELETE FROM server_databases
                    WHERE server_databases.uuid = $1
                    "#,
                )
                .bind(row.get::<uuid::Uuid, _>("uuid"))
                .execute(database.write())
                .await
                .ok();

                return Err(err);
            }
        }

        Ok(row.get("uuid"))
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.uuid = $1
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.server_uuid = $1 AND server_databases.uuid = $2
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(server_uuid)
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
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.server_uuid = $1 AND ($2 IS NULL OR server_databases.name ILIKE '%' || $2 || '%')
            ORDER BY server_databases.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None, None),
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

    pub async fn all_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.server_uuid = $1
            "#,
            Self::columns_sql(None, None),
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
            FROM server_databases
            WHERE server_databases.server_uuid = $1
            "#,
        )
        .bind(server_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn rotate_password(
        &self,
        database: &crate::database::Database,
    ) -> Result<String, sqlx::Error> {
        let new_password = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 24);

        match self.database_host.get_connection(database).await? {
            crate::models::database_host::DatabasePool::Mysql(pool) => {
                sqlx::query(&format!(
                    "ALTER USER '{}'@'%' IDENTIFIED BY '{}'",
                    self.username, new_password
                ))
                .execute(pool.as_ref())
                .await?;
            }
            crate::models::database_host::DatabasePool::Postgres(pool) => {
                sqlx::query(&format!(
                    "ALTER USER \"{}\" WITH PASSWORD '{}'",
                    self.username, new_password
                ))
                .execute(pool.as_ref())
                .await?;
            }
        }

        sqlx::query(
            r#"
            UPDATE server_databases
            SET password = $1
            WHERE server_databases.uuid = $2
            "#,
        )
        .bind(database.encrypt(&new_password).unwrap())
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(new_password)
    }

    pub async fn get_size(&self, database: &crate::database::Database) -> Result<i64, sqlx::Error> {
        match self.database_host.get_connection(database).await? {
            crate::models::database_host::DatabasePool::Mysql(pool) => {
                let row = sqlx::query(&format!(
                    "SELECT CAST(SUM(data_length + index_length) AS INTEGER) FROM information_schema.tables WHERE table_schema = '{}'",
                    self.name
                ))
                .fetch_one(pool.as_ref())
                .await?;

                Ok(row.get::<Option<i64>, _>(0).unwrap_or(0))
            }
            crate::models::database_host::DatabasePool::Postgres(pool) => {
                let row = sqlx::query(&format!("SELECT pg_database_size('{}')", self.name))
                    .fetch_one(pool.as_ref())
                    .await?;

                Ok(row.get::<Option<i64>, _>(0).unwrap_or(0))
            }
        }
    }

    pub async fn delete(&self, database: &crate::database::Database) -> Result<(), sqlx::Error> {
        match self.database_host.get_connection(database).await? {
            crate::models::database_host::DatabasePool::Mysql(pool) => {
                sqlx::query(&format!("DROP USER IF EXISTS '{}'@'%'", self.username))
                    .execute(pool.as_ref())
                    .await?;
                sqlx::query(&format!("DROP DATABASE IF EXISTS `{}`", self.name))
                    .execute(pool.as_ref())
                    .await?;
            }
            crate::models::database_host::DatabasePool::Postgres(pool) => {
                sqlx::query(&format!("DROP USER IF EXISTS \"{}\"", self.username))
                    .execute(pool.as_ref())
                    .await?;
                sqlx::query(&format!("DROP DATABASE IF EXISTS \"{}\"", self.name))
                    .execute(pool.as_ref())
                    .await?;
            }
        }

        sqlx::query(
            r#"
            DELETE FROM server_databases
            WHERE server_databases.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(
        self,
        database: &crate::database::Database,
        show_password: bool,
    ) -> ApiServerDatabase {
        ApiServerDatabase {
            uuid: self.uuid,
            r#type: self.database_host.r#type,
            host: self
                .database_host
                .public_host
                .unwrap_or(self.database_host.host),
            port: self
                .database_host
                .public_port
                .unwrap_or(self.database_host.port),
            name: self.name,
            username: self.username,
            password: if show_password {
                Some(database.decrypt(&self.password).unwrap())
            } else {
                None
            },
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerDatabase")]
pub struct ApiServerDatabase {
    pub uuid: uuid::Uuid,

    pub r#type: DatabaseType,
    pub host: String,
    pub port: i32,

    pub name: String,
    pub username: String,
    pub password: Option<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
