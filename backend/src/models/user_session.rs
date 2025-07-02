use super::BaseModel;
use serde::{Deserialize, Serialize};
use sha2::Digest;
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserSession {
    pub id: i32,

    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub user_agent: String,

    pub last_used: NaiveDateTime,
    pub created: NaiveDateTime,
}

impl BaseModel for UserSession {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("user_sessions");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.ip", table),
                format!("{}ip", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.user_agent", table),
                format!("{}user_agent", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.last_used", table),
                format!("{}last_used", prefix.unwrap_or_default()),
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
            ip: row.get(format!("{}ip", prefix).as_str()),
            user_agent: row.get(format!("{}user_agent", prefix).as_str()),
            last_used: row.get(format!("{}last_used", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl UserSession {
    pub async fn create(
        database: &crate::database::Database,
        user_id: i32,
        ip: sqlx::types::ipnetwork::IpNetwork,
        user_agent: &str,
    ) -> String {
        let mut hash = sha2::Sha256::new();
        hash.update(chrono::Utc::now().timestamp().to_be_bytes());
        hash.update(user_id.to_be_bytes());
        let hash = format!("{:x}", hash.finalize());

        sqlx::query(
            r#"
            INSERT INTO user_sessions (user_id, key, ip, user_agent, last_used, created)
            VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, NOW(), NOW())
            "#,
        )
        .bind(user_id)
        .bind(&hash)
        .bind(ip)
        .bind(user_agent)
        .execute(database.write())
        .await
        .unwrap();

        hash
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM user_sessions
            WHERE user_sessions.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserSession {
        ApiUserSession {
            id: self.id,
            ip: self.ip.ip().to_string(),
            user_agent: self.user_agent,
            last_used: self.last_used,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
#[schema(title = "UserSession")]
pub struct ApiUserSession {
    pub id: i32,

    pub ip: String,
    pub user_agent: String,

    pub last_used: NaiveDateTime,
    pub created: NaiveDateTime,
}
