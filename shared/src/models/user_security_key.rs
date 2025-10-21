use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserSecurityKey {
    pub uuid: uuid::Uuid,

    pub name: String,

    pub passkey: Option<webauthn_rs::prelude::Passkey>,
    pub registration: Option<webauthn_rs::prelude::PasskeyRegistration>,

    pub last_used: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserSecurityKey {
    const NAME: &'static str = "user_security_key";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("user_security_keys.uuid", format!("{prefix}uuid")),
            ("user_security_keys.name", format!("{prefix}name")),
            ("user_security_keys.passkey", format!("{prefix}passkey")),
            (
                "user_security_keys.registration",
                format!("{prefix}registration"),
            ),
            ("user_security_keys.last_used", format!("{prefix}last_used")),
            ("user_security_keys.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            passkey: if row
                .try_get::<serde_json::Value, _>(format!("{prefix}passkey").as_str())
                .is_ok()
            {
                serde_json::from_value(row.get(format!("{prefix}passkey").as_str())).ok()
            } else {
                None
            },
            registration: if row
                .try_get::<serde_json::Value, _>(format!("{prefix}registration").as_str())
                .is_ok()
            {
                serde_json::from_value(row.get(format!("{prefix}registration").as_str())).ok()
            } else {
                None
            },
            last_used: row.get(format!("{prefix}last_used").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserSecurityKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        registration: webauthn_rs::prelude::PasskeyRegistration,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_security_keys (user_uuid, name, credential_id, registration, created)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(rand::random_iter::<u8>().take(16).collect::<Vec<u8>>())
        .bind(serde_json::to_value(registration).unwrap())
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_user_uuid_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_security_keys
            WHERE user_security_keys.user_uuid = $1 AND user_security_keys.uuid = $2
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
            FROM user_security_keys
            WHERE user_security_keys.user_uuid = $1 AND user_security_keys.passkey IS NOT NULL AND ($2 IS NULL OR user_security_keys.name ILIKE '%' || $2 || '%')
            ORDER BY user_security_keys.created
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
            DELETE FROM user_security_keys
            WHERE user_security_keys.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserSecurityKey {
        ApiUserSecurityKey {
            uuid: self.uuid,
            name: self.name,
            last_used: self.last_used.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "UserSecurityKey")]
pub struct ApiUserSecurityKey {
    pub uuid: uuid::Uuid,

    pub name: String,

    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
