use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserApiKey {
    pub id: i32,

    pub name: String,
    pub key_start: String,
    pub permissions: Vec<String>,

    pub last_used: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserApiKey {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("user_api_keys");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.name", table),
                format!("{}name", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.key_start", table),
                format!("{}key_start", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.permissions", table),
                format!("{}permissions", prefix.unwrap_or_default()),
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
            name: row.get(format!("{}name", prefix).as_str()),
            key_start: row.get(format!("{}key_start", prefix).as_str()),
            permissions: row.get(format!("{}permissions", prefix).as_str()),
            last_used: row.get(format!("{}last_used", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl UserApiKey {
    pub async fn create(
        database: &crate::database::Database,
        user_id: i32,
        name: &str,
        permissions: Vec<String>,
    ) -> Result<(String, Self), sqlx::Error> {
        let key = format!(
            "ptlc_{}",
            rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 43)
        );

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_api_keys (user_id, name, key_start, key, permissions, created)
            VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(user_id)
        .bind(name)
        .bind(&key[0..16])
        .bind(&key)
        .bind(permissions)
        .fetch_one(database.write())
        .await?;

        Ok((key, Self::map(None, &row)))
    }

    pub async fn by_key_start(
        database: &crate::database::Database,
        user_id: i32,
        key_start: &str,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_api_keys
            WHERE user_api_keys.key_start = $1 AND user_api_keys.user_id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(key_start)
        .bind(user_id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
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
            FROM user_api_keys
            WHERE user_api_keys.user_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
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

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) -> bool {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE user_api_keys.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .is_ok()
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserApiKey {
        ApiUserApiKey {
            id: self.id,
            name: self.name,
            key_start: self.key_start,
            permissions: self.permissions,
            last_used: self.last_used.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "UserApiKey")]
pub struct ApiUserApiKey {
    pub id: i32,

    pub name: String,
    pub key_start: String,
    pub permissions: Vec<String>,

    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
