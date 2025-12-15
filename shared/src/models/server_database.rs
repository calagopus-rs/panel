use crate::{
    models::database_host::{DatabaseTransaction, DatabaseType},
    prelude::*,
    storage::StorageUrlRetriever,
};
use rand::distr::SampleString;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

pub static DB_NAME_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9_]+$").expect("Failed to compile database name regex")
});

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerDatabase {
    pub uuid: uuid::Uuid,
    pub server: Fetchable<super::server::Server>,
    pub database_host: super::database_host::DatabaseHost,

    pub name: compact_str::CompactString,
    pub locked: bool,

    pub username: compact_str::CompactString,
    pub password: Vec<u8>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerDatabase {
    const NAME: &'static str = "server_database";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            (
                "server_databases.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "server_databases.server_uuid",
                compact_str::format_compact!("{prefix}server_uuid"),
            ),
            (
                "server_databases.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "server_databases.locked",
                compact_str::format_compact!("{prefix}locked"),
            ),
            (
                "server_databases.username",
                compact_str::format_compact!("{prefix}username"),
            ),
            (
                "server_databases.password",
                compact_str::format_compact!("{prefix}password"),
            ),
            (
                "server_databases.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ]);

        columns.extend(super::database_host::DatabaseHost::columns(Some(
            "database_host_",
        )));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            server: super::server::Server::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}server_uuid").as_str())?,
            ),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row)?,
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            locked: row.try_get(compact_str::format_compact!("{prefix}locked").as_str())?,
            username: row.try_get(compact_str::format_compact!("{prefix}username").as_str())?,
            password: row.try_get(compact_str::format_compact!("{prefix}password").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl ServerDatabase {
    pub async fn create(
        database: &crate::database::Database,
        server: &super::server::Server,
        database_host: &super::database_host::DatabaseHost,
        name: &str,
    ) -> Result<uuid::Uuid, crate::database::DatabaseError> {
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
        .bind(database.encrypt(password.clone()).await?)
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

                return Err(err.into());
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

                return Err(err.into());
            }
        }

        Ok(row.try_get("uuid")?)
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_server_uuid_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.server_uuid = $1 AND server_databases.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_database_host_uuid_with_pagination(
        database: &crate::database::Database,
        database_host_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.database_host_uuid = $1 AND ($2 IS NULL OR server_databases.name ILIKE '%' || $2 || '%')
            ORDER BY server_databases.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(database_host_uuid)
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

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
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
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
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

    pub async fn all_by_server_uuid(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.uuid = server_databases.database_host_uuid
            WHERE server_databases.server_uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(server_uuid)
        .fetch_all(database.read())
        .await?;

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
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

    pub async fn count_by_database_host_uuid(
        database: &crate::database::Database,
        database_host_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_databases
            WHERE server_databases.database_host_uuid = $1
            "#,
        )
        .bind(database_host_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn rotate_password(
        &self,
        database: &crate::database::Database,
    ) -> Result<String, anyhow::Error> {
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
        .bind(database.encrypt(new_password.clone()).await?)
        .bind(self.uuid)
        .execute(database.write())
        .await?;

        Ok(new_password)
    }

    pub async fn get_size(
        &self,
        database: &crate::database::Database,
    ) -> Result<i64, crate::database::DatabaseError> {
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

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
        storage_url_retriever: &StorageUrlRetriever<'_>,
    ) -> Result<AdminApiServerDatabase, anyhow::Error> {
        Ok(AdminApiServerDatabase {
            uuid: self.uuid,
            server: self
                .server
                .fetch_cached(database)
                .await?
                .into_admin_api_object(database, storage_url_retriever)
                .await?,
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
            is_locked: self.locked,
            username: self.username,
            password: database.decrypt(self.password).await?,
            created: self.created.and_utc(),
        })
    }

    #[inline]
    pub async fn into_api_object(
        self,
        database: &crate::database::Database,
        show_password: bool,
    ) -> Result<ApiServerDatabase, anyhow::Error> {
        let mut username = self.username;
        let space_idx = username.find(' ');

        if let Some(space_idx) = space_idx {
            username.truncate(space_idx);
        }

        Ok(ApiServerDatabase {
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
            is_locked: self.locked,
            username,
            password: if show_password {
                Some(database.decrypt(self.password).await?)
            } else {
                None
            },
            created: self.created.and_utc(),
        })
    }
}

#[derive(Default)]
pub struct DeleteServerDatabaseOptions {
    pub force: bool,
}

#[async_trait::async_trait]
impl DeletableModel for ServerDatabase {
    type DeleteOptions = DeleteServerDatabaseOptions;

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<ServerDatabase>> =
            LazyLock::new(|| Arc::new(ListenerList::default()));

        &DELETE_LISTENERS
    }

    async fn delete(
        &self,
        database: &Arc<crate::database::Database>,
        options: Self::DeleteOptions,
    ) -> Result<(), anyhow::Error> {
        let mut transaction = database.write().begin().await?;

        if self.name.contains(|c| ['"', '\'', '`'].contains(&c))
            || self.username.contains(|c| ['"', '\'', '`'].contains(&c))
        {
            return Err(anyhow::anyhow!(
                "unable to delete database with escape characters"
            ));
        }

        self.run_delete_listeners(&options, database, &mut transaction)
            .await?;

        let connection = self.database_host.get_connection(database).await?;
        let database_name = self.name.clone();
        let database_username = self.username.trim_end().to_string();
        let database_uuid = self.uuid;

        tokio::spawn(async move {
            let run_delete = async || {
                match connection {
                    crate::models::database_host::DatabasePool::Mysql(pool) => {
                        sqlx::query(&format!("DROP DATABASE IF EXISTS `{}`", database_name))
                            .execute(pool.as_ref())
                            .await?;
                        sqlx::query(&format!("DROP USER IF EXISTS '{}'@'%'", database_username))
                            .execute(pool.as_ref())
                            .await?;
                    }
                    crate::models::database_host::DatabasePool::Postgres(pool) => {
                        sqlx::query(&format!("DROP DATABASE IF EXISTS \"{}\"", database_name))
                            .execute(pool.as_ref())
                            .await?;
                        sqlx::query(&format!("DROP USER IF EXISTS \"{}\"", database_username))
                            .execute(pool.as_ref())
                            .await?;
                    }
                }

                Ok::<_, anyhow::Error>(())
            };

            if let Err(err) = run_delete().await
                && !options.force
            {
                if err
                    .downcast_ref::<sqlx::Error>()
                    .and_then(|e| e.as_database_error())
                    .is_some_and(|e| e.message().contains("is being accessed"))
                {
                    return Err(crate::response::DisplayError::new(
                        "this database is being accessed, unable to delete.",
                    )
                    .into());
                }

                return Err(err);
            }

            sqlx::query(
                r#"
                DELETE FROM server_databases
                WHERE server_databases.uuid = $1
                "#,
            )
            .bind(database_uuid)
            .execute(&mut *transaction)
            .await?;

            transaction.commit().await?;

            Ok(())
        })
        .await?
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminServerDatabase")]
pub struct AdminApiServerDatabase {
    pub uuid: uuid::Uuid,
    pub server: super::server::AdminApiServer,

    pub r#type: DatabaseType,
    pub host: compact_str::CompactString,
    pub port: i32,

    pub name: compact_str::CompactString,
    pub is_locked: bool,

    pub username: compact_str::CompactString,
    pub password: compact_str::CompactString,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerDatabase")]
pub struct ApiServerDatabase {
    pub uuid: uuid::Uuid,

    pub r#type: DatabaseType,
    pub host: compact_str::CompactString,
    pub port: i32,

    pub name: compact_str::CompactString,
    pub is_locked: bool,

    pub username: compact_str::CompactString,
    pub password: Option<compact_str::CompactString>,

    pub created: chrono::DateTime<chrono::Utc>,
}
