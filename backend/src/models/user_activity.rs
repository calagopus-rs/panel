use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserActivity {
    pub id: i32,
    pub api_key_id: Option<i32>,

    pub event: String,
    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub data: serde_json::Value,

    pub created: NaiveDateTime,
}

impl BaseModel for UserActivity {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("user_activities");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.api_key_id", table),
                format!("{}api_key_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.event", table),
                format!("{}event", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.ip", table),
                format!("{}ip", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.data", table),
                format!("{}data", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            api_key_id: row.get(format!("{}api_key_id", prefix).as_str()),
            event: row.get(format!("{}event", prefix).as_str()),
            ip: row.get(format!("{}ip", prefix).as_str()),
            data: row.get(format!("{}data", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
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
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM user_activities
            WHERE user_activities.user_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
        ))
        .bind(user_id)
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

    #[inline]
    pub fn into_api_object(self) -> ApiUserActivity {
        ApiUserActivity {
            id: self.id,
            event: self.event,
            ip: self.ip.ip().to_string(),
            data: self.data,
            is_api: self.api_key_id.is_some(),
            created: self.created,
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

    pub created: NaiveDateTime,
}
