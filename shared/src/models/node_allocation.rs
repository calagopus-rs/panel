use crate::{prelude::*, storage::StorageUrlRetriever};
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct NodeAllocation {
    pub uuid: uuid::Uuid,
    pub server: Option<Fetchable<super::server::Server>>,

    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub ip_alias: Option<compact_str::CompactString>,
    pub port: i32,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NodeAllocation {
    const NAME: &'static str = "node_allocation";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "node_allocations.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "node_allocations.ip",
                compact_str::format_compact!("{prefix}ip"),
            ),
            (
                "node_allocations.ip_alias",
                compact_str::format_compact!("{prefix}ip_alias"),
            ),
            (
                "node_allocations.port",
                compact_str::format_compact!("{prefix}port"),
            ),
            (
                "node_allocations.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            server: if let Ok(server_uuid) = row.try_get::<uuid::Uuid, _>("server_uuid") {
                Some(super::server::Server::get_fetchable(server_uuid))
            } else {
                None
            },
            ip: row.try_get(compact_str::format_compact!("{prefix}ip").as_str())?,
            ip_alias: row.try_get(compact_str::format_compact!("{prefix}ip_alias").as_str())?,
            port: row.try_get(compact_str::format_compact!("{prefix}port").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
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
            SELECT {}, server_allocations.server_uuid, COUNT(*) OVER() AS total_count
            FROM node_allocations
            LEFT JOIN server_allocations ON server_allocations.allocation_uuid = node_allocations.uuid
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
        node_uuid: uuid::Uuid,
        uuids: &[uuid::Uuid],
    ) -> Result<u64, crate::database::DatabaseError> {
        let deleted = sqlx::query(
            r#"
            DELETE FROM node_allocations
            WHERE node_allocations.node_uuid = $1 AND node_allocations.uuid = ANY($2)
            "#,
        )
        .bind(node_uuid)
        .bind(uuids)
        .execute(database.write())
        .await?
        .rows_affected();

        Ok(deleted)
    }

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
        storage_url_retriever: &StorageUrlRetriever<'_>,
    ) -> Result<AdminApiNodeAllocation, crate::database::DatabaseError> {
        let server = match self.server {
            Some(fetchable) => Some(
                fetchable
                    .fetch_cached(database)
                    .await?
                    .into_admin_api_object(database, storage_url_retriever)
                    .await?,
            ),
            None => None,
        };

        Ok(AdminApiNodeAllocation {
            uuid: self.uuid,
            server,
            ip: compact_str::format_compact!("{}", self.ip.ip()),
            ip_alias: self.ip_alias,
            port: self.port,
            created: self.created.and_utc(),
        })
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NodeAllocation")]
pub struct AdminApiNodeAllocation {
    pub uuid: uuid::Uuid,
    pub server: Option<super::server::AdminApiServer>,

    pub ip: compact_str::CompactString,
    pub ip_alias: Option<compact_str::CompactString>,
    pub port: i32,

    pub created: chrono::DateTime<chrono::Utc>,
}
