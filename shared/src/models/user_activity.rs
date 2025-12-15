use crate::{State, prelude::*};
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

pub type GetUserActivityLogger = crate::extract::ConsumingExtension<UserActivityLogger>;

#[derive(Clone)]
pub struct UserActivityLogger {
    pub state: State,
    pub user_uuid: uuid::Uuid,
    pub api_key_uuid: Option<uuid::Uuid>,
    pub ip: std::net::IpAddr,
}

impl UserActivityLogger {
    pub async fn log(&self, event: &str, data: serde_json::Value) {
        if let Err(err) = crate::models::user_activity::UserActivity::log(
            &self.state.database,
            self.user_uuid,
            self.api_key_uuid,
            event,
            Some(self.ip.into()),
            data,
        )
        .await
        {
            tracing::warn!(
                user = %self.user_uuid,
                "failed to log user activity: {:#?}",
                err
            );
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct UserActivity {
    pub api_key_uuid: Option<uuid::Uuid>,

    pub event: compact_str::CompactString,
    pub ip: Option<sqlx::types::ipnetwork::IpNetwork>,
    pub data: serde_json::Value,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserActivity {
    const NAME: &'static str = "user_activity";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "user_activities.api_key_uuid",
                compact_str::format_compact!("{prefix}api_key_uuid"),
            ),
            (
                "user_activities.event",
                compact_str::format_compact!("{prefix}event"),
            ),
            (
                "user_activities.ip",
                compact_str::format_compact!("{prefix}ip"),
            ),
            (
                "user_activities.data",
                compact_str::format_compact!("{prefix}data"),
            ),
            (
                "user_activities.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            api_key_uuid: row
                .try_get(compact_str::format_compact!("{prefix}api_key_uuid").as_str())?,
            event: row.try_get(compact_str::format_compact!("{prefix}event").as_str())?,
            ip: row.try_get(compact_str::format_compact!("{prefix}ip").as_str())?,
            data: row.try_get(compact_str::format_compact!("{prefix}data").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl UserActivity {
    pub async fn log(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        api_key_uuid: Option<uuid::Uuid>,
        event: &str,
        ip: Option<sqlx::types::ipnetwork::IpNetwork>,
        data: serde_json::Value,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            INSERT INTO user_activities (user_uuid, api_key_uuid, event, ip, data, created)
            VALUES ($1, $2, $3, $4, $5, NOW())
            "#,
        )
        .bind(user_uuid)
        .bind(api_key_uuid)
        .bind(event)
        .bind(ip)
        .bind(data)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_user_uuid_with_pagination(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM user_activities
            WHERE user_activities.user_uuid = $1 AND ($2 IS NULL OR user_activities.event ILIKE '%' || $2 || '%')
            ORDER BY user_activities.created DESC
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
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

    #[inline]
    pub fn into_api_object(self) -> ApiUserActivity {
        ApiUserActivity {
            event: self.event,
            ip: self
                .ip
                .map(|ip| compact_str::format_compact!("{}", ip.ip())),
            data: self.data,
            is_api: self.api_key_uuid.is_some(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "UserActivity")]
pub struct ApiUserActivity {
    pub event: compact_str::CompactString,
    pub ip: Option<compact_str::CompactString>,
    pub data: serde_json::Value,

    pub is_api: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
