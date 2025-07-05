use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerDatabase {
    pub id: i32,
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

        BTreeMap::from([
            (format!("{}.id", table), format!("{}id", prefix)),
            (
                format!("{}.database_host_id", table),
                format!("{}database_host_id", prefix),
            ),
            (format!("{}.name", table), format!("{}name", prefix)),
            (format!("{}.username", table), format!("{}username", prefix)),
            (format!("{}.password", table), format!("{}password", prefix)),
            (
                format!("{}.created_at", table),
                format!("{}created", prefix),
            ),
        ])
        .into_iter()
        .chain(super::database_host::DatabaseHost::columns(
            Some("database_host_"),
            None,
        ))
        .collect()
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            database_host: super::database_host::DatabaseHost::map(Some("database_host_"), row),
            name: row.get(format!("{}name", prefix).as_str()),
            username: row.get(format!("{}username", prefix).as_str()),
            password: row.get(format!("{}password", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl ServerDatabase {
    pub async fn create(
        database: &crate::database::Database,
        server_id: i32,
        database_host_id: i32,
        name: &str,
    ) -> Result<i32, sqlx::Error> {
        let mut rng = rand::rng();

        let username = format!(
            "u{}_{}",
            server_id,
            rand::distr::Alphanumeric.sample_string(&mut rng, 10)
        );
        let password = rand::distr::Alphanumeric.sample_string(&mut rng, 24);

        let row = sqlx::query(
            r#"
            INSERT INTO server_databases (server_id, database_host_id, name, username, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind(server_id)
        .bind(database_host_id)
        .bind(name)
        .bind(username)
        .bind(database.encrypt(&password).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(row.get("id"))
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM server_databases
            JOIN database_hosts ON database_hosts.id = server_databases.database_host_id
            WHERE server_databases.id = $1
            "#,
            Self::columns_sql(None, None),
            super::database_host::DatabaseHost::columns_sql(Some("database_host_"), None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn rotate_password(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<String, sqlx::Error> {
        let mut rng = rand::rng();
        let new_password = rand::distr::Alphanumeric.sample_string(&mut rng, 24);

        sqlx::query(
            r#"
            UPDATE server_databases
            SET server_databases.password = $1
            WHERE server_databases.id = $2
            "#,
        )
        .bind(database.encrypt(&new_password).unwrap())
        .bind(id)
        .execute(database.write())
        .await?;

        Ok(new_password)
    }

    pub async fn by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}, COUNT(*) OVER() AS total_count
            FROM server_databases
            JOIN database_hosts ON database_hosts.id = server_databases.database_host_id
            WHERE server_databases.server_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::database_host::DatabaseHost::columns_sql(Some("database_host_"), None)
        ))
        .bind(server_id)
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
            DELETE FROM server_databases
            WHERE server_databases.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_api_object(
        self,
        database: &crate::database::Database,
        show_password: bool,
    ) -> ApiServerDatabase {
        ApiServerDatabase {
            id: self.id,
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
    pub id: i32,

    pub host: String,
    pub port: i32,

    pub name: String,
    pub username: String,
    pub password: Option<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
