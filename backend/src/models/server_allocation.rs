use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerAllocation {
    pub id: i32,
    pub allocation: super::node_allocation::NodeAllocation,

    pub notes: Option<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerAllocation {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_allocations");

        let mut columns = BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (
                format!("{table}.allocation_id"),
                format!("{prefix}allocation_id"),
            ),
            (format!("{table}.notes"), format!("{prefix}notes")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::node_allocation::NodeAllocation::columns(
            Some("allocation_"),
            None,
        ));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            allocation: super::node_allocation::NodeAllocation::map(Some("allocation_"), row),
            notes: row.get(format!("{prefix}notes").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerAllocation {
    pub async fn create(
        database: &crate::database::Database,
        server_id: i32,
        allocation_id: i32,
    ) -> Result<i32, sqlx::Error> {
        let row = sqlx::query(
            r#"
            INSERT INTO server_allocations (server_id, allocation_id)
            VALUES ($1, $2)
            RETURNING id
            "#,
        )
        .bind(server_id)
        .bind(allocation_id)
        .fetch_one(database.write())
        .await?;

        Ok(row.get("id"))
    }

    pub async fn create_random(
        database: &crate::database::Database,
        server: &super::server::Server,
    ) -> Result<i32, sqlx::Error> {
        let row = sqlx::query(
            r#"
            INSERT INTO server_allocations (server_id, allocation_id)
            VALUES ($1, (
                SELECT node_allocations.id FROM node_allocations
                LEFT JOIN server_allocations ON server_allocations.allocation_id = node_allocations.id
                WHERE
                    node_allocations.node_id = $2
                    AND node_allocations.port BETWEEN $3 AND $4
                    AND server_allocations.id IS NULL
                ORDER BY RANDOM()
                LIMIT 1
            ))
            RETURNING id
            "#,
        )
        .bind(server.id)
        .bind(server.node.id)
        .bind(server.egg.config_allocations.user_self_assign.start_port as i32)
        .bind(server.egg.config_allocations.user_self_assign.end_port as i32)
        .fetch_one(database.write())
        .await?;

        Ok(row.get("id"))
    }

    pub async fn by_id(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_allocations
            JOIN node_allocations ON server_allocations.allocation_id = node_allocations.id
            WHERE server_allocations.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_id_id(
        database: &crate::database::Database,
        server_id: i32,
        allocation_id: i32,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_allocations
            JOIN node_allocations ON server_allocations.allocation_id = node_allocations.id
            WHERE server_allocations.server_id = $1 AND server_allocations.id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
        .bind(allocation_id)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_allocations
            JOIN node_allocations ON server_allocations.allocation_id = node_allocations.id
            WHERE server_allocations.server_id = $1
            ORDER BY server_allocations.id ASC
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
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

    pub async fn count_by_server_id(database: &crate::database::Database, server_id: i32) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM server_allocations
            WHERE server_allocations.server_id = $1
            "#,
        )
        .bind(server_id)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn delete_by_id(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM server_allocations
            WHERE server_allocations.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self, primary: Option<i32>) -> ApiServerAllocation {
        ApiServerAllocation {
            id: self.id,
            ip: self.allocation.ip.ip().to_string(),
            ip_alias: self.allocation.ip_alias,
            port: self.allocation.port,
            notes: self.notes,
            is_primary: primary.is_some_and(|p| p == self.id),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerAllocation")]
pub struct ApiServerAllocation {
    pub id: i32,

    pub ip: String,
    pub ip_alias: Option<String>,
    pub port: i32,

    pub notes: Option<String>,
    pub is_primary: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
