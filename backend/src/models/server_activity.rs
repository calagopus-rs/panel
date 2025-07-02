use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerActivity {
    pub id: i32,
    pub user: super::user::User,
    pub api_key_id: Option<i32>,

    pub event: String,
    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub data: serde_json::Value,

    pub created: NaiveDateTime,
}

impl BaseModel for ServerActivity {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("server_activities");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.user_id", table),
                format!("{}user_id", prefix.unwrap_or_default()),
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
            user: super::user::User::map(Some("user_"), row),
            api_key_id: row.get(format!("{}api_key_id", prefix).as_str()),
            event: row.get(format!("{}event", prefix).as_str()),
            ip: row.get(format!("{}ip", prefix).as_str()),
            data: row.get(format!("{}data", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl ServerActivity {
    pub async fn new(
        database: &crate::database::Database,
        server_id: i32,
        user_id: i32,
        api_key_id: Option<i32>,
        event: &str,
        ip: sqlx::types::ipnetwork::IpNetwork,
        data: serde_json::Value,
    ) -> Self {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO server_activities (server_id, user_id, api_key_id, event, ip, data)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_id)
        .bind(user_id)
        .bind(api_key_id)
        .bind(event)
        .bind(ip)
        .bind(data)
        .fetch_one(database.write())
        .await
        .unwrap();

        Self::map(None, &row)
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
            FROM server_activities
            JOIN users ON users.id = server_activities.user_id
            WHERE server_activities.server_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::user::User::columns_sql(Some("user_"), None)
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

    #[inline]
    pub fn into_api_object(self) -> ApiServerActivity {
        ApiServerActivity {
            id: self.id,
            user: self.user.into_api_object(false),
            event: self.event,
            ip: self.ip.ip().to_string(),
            data: self.data,
            is_api: self.api_key_id.is_some(),
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerActivity")]
pub struct ApiServerActivity {
    pub id: i32,
    pub user: super::user::ApiUser,

    pub event: String,
    pub ip: String,
    pub data: serde_json::Value,

    pub is_api: bool,

    pub created: NaiveDateTime,
}
