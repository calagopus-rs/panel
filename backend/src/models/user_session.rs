use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sha2::Digest;
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserSession {
    pub id: i32,

    pub ip: sqlx::types::ipnetwork::IpNetwork,
    pub user_agent: String,

    pub last_used: chrono::NaiveDateTime,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserSession {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("user_sessions");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.ip"), format!("{prefix}ip")),
            (format!("{table}.user_agent"), format!("{prefix}user_agent")),
            (format!("{table}.last_used"), format!("{prefix}last_used")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            ip: row.get(format!("{prefix}ip").as_str()),
            user_agent: row.get(format!("{prefix}user_agent").as_str()),
            last_used: row.get(format!("{prefix}last_used").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
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
        let key_id = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 16);

        let mut hash = sha2::Sha256::new();
        hash.update(chrono::Utc::now().timestamp().to_be_bytes());
        hash.update(user_id.to_be_bytes());
        let hash = format!("{:x}", hash.finalize());

        sqlx::query(
            r#"
            INSERT INTO user_sessions (user_id, key_id, key, ip, user_agent, last_used, created)
            VALUES ($1, $2, crypt($3, gen_salt('xdes', 321)), $4, $5, NOW(), NOW())
            "#,
        )
        .bind(user_id)
        .bind(&key_id)
        .bind(&hash)
        .bind(ip)
        .bind(user_agent)
        .execute(database.write())
        .await
        .unwrap();

        format!("{key_id}:{hash}")
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
            last_used: self.last_used.and_utc(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
#[schema(title = "UserSession")]
pub struct ApiUserSession {
    pub id: i32,

    pub ip: String,
    pub user_agent: String,

    pub last_used: chrono::DateTime<chrono::Utc>,
    pub created: chrono::DateTime<chrono::Utc>,
}
