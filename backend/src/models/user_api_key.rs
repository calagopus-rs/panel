use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserApiKey {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub key_start: String,
    pub permissions: Vec<String>,

    pub last_used: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserApiKey {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("user_api_keys.uuid", format!("{prefix}uuid")),
            ("user_api_keys.name", format!("{prefix}name")),
            ("user_api_keys.key_start", format!("{prefix}key_start")),
            ("user_api_keys.permissions", format!("{prefix}permissions")),
            ("user_api_keys.last_used", format!("{prefix}last_used")),
            ("user_api_keys.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            key_start: row.get(format!("{prefix}key_start").as_str()),
            permissions: row.get(format!("{prefix}permissions").as_str()),
            last_used: row.get(format!("{prefix}last_used").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserApiKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        permissions: Vec<String>,
    ) -> Result<(String, Self), sqlx::Error> {
        let key = format!(
            "ptlc_{}",
            rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 43)
        );

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_api_keys (user_uuid, name, key_start, key, permissions, created)
            VALUES ($1, $2, $3, crypt($4, gen_salt('xdes', 321)), $5, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(&key[0..16])
        .bind(&key)
        .bind(permissions)
        .fetch_one(database.write())
        .await?;

        Ok((key, Self::map(None, &row)))
    }

    pub async fn by_user_uuid_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_api_keys
            WHERE user_api_keys.user_uuid = $1 AND user_api_keys.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_user_uuid_with_pagination(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM user_api_keys
            WHERE user_api_keys.user_uuid = $1 AND ($2 IS NULL OR user_api_keys.name ILIKE '%' || $2 || '%')
            ORDER BY user_api_keys.created
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
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        })
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE user_api_keys.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserApiKey {
        ApiUserApiKey {
            uuid: self.uuid,
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
    pub uuid: uuid::Uuid,

    pub name: String,
    pub key_start: String,
    pub permissions: Vec<String>,

    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
