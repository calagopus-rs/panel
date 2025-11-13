use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct NodeAllocation {
    pub uuid: uuid::Uuid,

    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub ip_alias: Option<String>,
    pub port: i32,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NodeAllocation {
    const NAME: &'static str = "node_allocation";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("node_allocations.uuid", format!("{prefix}uuid")),
            ("node_allocations.ip", format!("{prefix}ip")),
            ("node_allocations.ip_alias", format!("{prefix}ip_alias")),
            ("node_allocations.port", format!("{prefix}port")),
            ("node_allocations.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(format!("{prefix}uuid").as_str())?,
            ip: row.try_get(format!("{prefix}ip").as_str())?,
            ip_alias: row.try_get(format!("{prefix}ip_alias").as_str())?,
            port: row.try_get(format!("{prefix}port").as_str())?,
            created: row.try_get(format!("{prefix}created").as_str())?,
        })
    }
}

impl NodeAllocation {
    pub async fn create(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        ip: &sqlx::types::ipnetwork::IpNetwork,
        ip_alias: Option<&str>,
        port: i32,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            INSERT INTO node_allocations (node_uuid, ip, ip_alias, port)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(node_uuid)
        .bind(ip)
        .bind(ip_alias)
        .bind(port)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_node_uuid_uuid(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM node_allocations
            WHERE node_allocations.node_uuid = $1 AND node_allocations.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn available_by_node_uuid_with_pagination(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM node_allocations
            LEFT JOIN server_allocations ON server_allocations.allocation_uuid = node_allocations.uuid
            WHERE
                ($2 IS NULL OR host(node_allocations.ip) || ':' || node_allocations.port ILIKE '%' || $2 || '%')
                AND (node_allocations.node_uuid = $1 AND server_allocations.uuid IS NULL)
            ORDER BY node_allocations.ip, node_allocations.port
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
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

    pub async fn by_node_uuid_with_pagination(
        database: &crate::database::Database,
        node_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM node_allocations
            WHERE node_allocations.node_uuid = $1 AND ($2 IS NULL OR host(node_allocations.ip) || ':' || node_allocations.port ILIKE '%' || $2 || '%')
            ORDER BY node_allocations.ip, node_allocations.port
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(node_uuid)
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

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        uuids: &[uuid::Uuid],
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            DELETE FROM node_allocations
            WHERE node_allocations.uuid = ANY($1)
            "#,
        )
        .bind(uuids)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNodeAllocation {
        AdminApiNodeAllocation {
            uuid: self.uuid,
            ip: self.ip.ip().to_string(),
            ip_alias: self.ip_alias,
            port: self.port,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NodeAllocation")]
pub struct AdminApiNodeAllocation {
    pub uuid: uuid::Uuid,

    pub ip: String,
    pub ip_alias: Option<String>,
    pub port: i32,

    pub created: chrono::DateTime<chrono::Utc>,
}
