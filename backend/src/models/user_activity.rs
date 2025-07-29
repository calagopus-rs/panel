use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserActivity {
    pub id: i32,
    pub api_key_id: Option<i32>,

    pub event: String,
    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub data: serde_json::Value,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserActivity {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("user_activities");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.api_key_id"), format!("{prefix}api_key_id")),
            (format!("{table}.event"), format!("{prefix}event")),
            (format!("{table}.ip"), format!("{prefix}ip")),
            (format!("{table}.data"), format!("{prefix}data")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            api_key_id: row.get(format!("{prefix}api_key_id").as_str()),
            event: row.get(format!("{prefix}event").as_str()),
            ip: row.get(format!("{prefix}ip").as_str()),
            data: row.get(format!("{prefix}data").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserActivity {
    pub async fn log(
        database: &crate::database::Database,
        user_id: i32,
        api_key_id: Option<i32>,
        event: &str,
        ip: sqlx::types::ipnetwork::IpNetwork,
        data: serde_json::Value,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO user_activities (user_id, api_key_id, event, ip, data, created)
            VALUES ($1, $2, $3, $4, $5, NOW())
            "#,
        )
        .bind(user_id)
        .bind(api_key_id)
        .bind(event)
        .bind(ip)
        .bind(data)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn by_user_id_with_pagination(
        database: &crate::database::Database,
        user_id: i32,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM user_activities
            WHERE user_activities.user_id = $1 AND ($2 IS NULL OR user_activities.event ILIKE '%' || $2 || '%')
            ORDER BY user_activities.created DESC
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(user_id)
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

    #[inline]
    pub fn into_api_object(self) -> ApiUserActivity {
        ApiUserActivity {
            id: self.id,
            event: self.event,
            ip: self.ip.ip().to_string(),
            data: self.data,
            is_api: self.api_key_id.is_some(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "UserActivity")]
pub struct ApiUserActivity {
    pub id: i32,

    pub event: String,
    pub ip: String,
    pub data: serde_json::Value,

    pub is_api: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
