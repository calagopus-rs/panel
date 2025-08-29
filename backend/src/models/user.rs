use super::BaseModel;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, sync::LazyLock};
use utoipa::ToSchema;
use webauthn_rs::prelude::CredentialID;

pub static USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-zA-Z0-9_]+$").expect("Failed to compile username regex"));

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub uuid: uuid::Uuid,
    pub external_id: Option<String>,

    pub avatar: Option<String>,
    pub username: String,
    pub email: String,

    pub name_first: String,
    pub name_last: String,

    pub admin: bool,
    pub totp_enabled: bool,
    pub totp_secret: Option<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for User {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("users");

        BTreeMap::from([
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (
                format!("{table}.external_id"),
                format!("{prefix}external_id"),
            ),
            (format!("{table}.avatar"), format!("{prefix}avatar")),
            (format!("{table}.username"), format!("{prefix}username")),
            (format!("{table}.email"), format!("{prefix}email")),
            (format!("{table}.name_first"), format!("{prefix}name_first")),
            (format!("{table}.name_last"), format!("{prefix}name_last")),
            (format!("{table}.admin"), format!("{prefix}admin")),
            (
                format!("{table}.totp_enabled"),
                format!("{prefix}totp_enabled"),
            ),
            (
                format!("{table}.totp_secret"),
                format!("{prefix}totp_secret"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            external_id: row.get(format!("{prefix}external_id").as_str()),
            avatar: row.get(format!("{prefix}avatar").as_str()),
            username: row.get(format!("{prefix}username").as_str()),
            email: row.get(format!("{prefix}email").as_str()),
            name_first: row.get(format!("{prefix}name_first").as_str()),
            name_last: row.get(format!("{prefix}name_last").as_str()),
            admin: row.get(format!("{prefix}admin").as_str()),
            totp_enabled: row.get(format!("{prefix}totp_enabled").as_str()),
            totp_secret: row.get(format!("{prefix}totp_secret").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl User {
    pub async fn create(
        database: &crate::database::Database,
        username: &str,
        email: &str,
        name_first: &str,
        name_last: &str,
        password: &str,
        admin: bool,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO users (username, email, name_first, name_last, password, admin)
            VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)), $6)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(username)
        .bind(email)
        .bind(name_first)
        .bind(name_last)
        .bind(password)
        .bind(admin)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.uuid = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_session(
        database: &crate::database::Database,
        session: &str,
    ) -> Result<Option<(Self, super::user_session::UserSession)>, sqlx::Error> {
        let (key_id, key) = match session.split_once(':') {
            Some((key_id, key)) => (key_id, key),
            None => return Ok(None),
        };

        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            JOIN user_sessions ON user_sessions.user_uuid = users.uuid
            WHERE user_sessions.key_id = $1 AND user_sessions.key = crypt($2, user_sessions.key)
            "#,
            Self::columns_sql(None, None),
            super::user_session::UserSession::columns_sql(Some("session_"), None)
        ))
        .bind(key_id)
        .bind(key)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| {
            (
                Self::map(None, &row),
                super::user_session::UserSession::map(Some("session_"), &row),
            )
        }))
    }

    pub async fn by_api_key(
        database: &crate::database::Database,
        key: &str,
    ) -> Result<Option<(Self, super::user_api_key::UserApiKey)>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            JOIN user_api_keys ON user_api_keys.user_uuid = users.uuid
            WHERE user_api_keys.key_start = $1 AND user_api_keys.key = crypt($2, user_api_keys.key)
            "#,
            Self::columns_sql(None, None),
            super::user_api_key::UserApiKey::columns_sql(Some("api_key_"), None)
        ))
        .bind(&key[0..16])
        .bind(key)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| {
            (
                Self::map(None, &row),
                super::user_api_key::UserApiKey::map(Some("api_key_"), &row),
            )
        }))
    }

    pub async fn by_credential_id(
        database: &crate::database::Database,
        credential_id: &CredentialID,
    ) -> Result<Option<(Self, super::user_security_key::UserSecurityKey)>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            JOIN user_security_keys ON user_security_keys.user_uuid = users.uuid
            WHERE user_security_keys.credential_id = $1
            "#,
            Self::columns_sql(None, None),
            super::user_security_key::UserSecurityKey::columns_sql(Some("security_key_"), None)
        ))
        .bind(credential_id.to_vec())
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| {
            (
                Self::map(None, &row),
                super::user_security_key::UserSecurityKey::map(Some("security_key_"), &row),
            )
        }))
    }

    pub async fn by_email(
        database: &crate::database::Database,
        email: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.email = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(email)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_username_password(
        database: &crate::database::Database,
        username: &str,
        password: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.username = $1 AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(username)
        .bind(password)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_username_public_key(
        database: &crate::database::Database,
        username: &str,
        public_key: russh::keys::PublicKey,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            JOIN user_ssh_keys ON user_ssh_keys.user_uuid = users.uuid
            WHERE users.username = $1 AND user_ssh_keys.fingerprint = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(username)
        .bind(
            public_key
                .fingerprint(russh::keys::HashAlg::Sha256)
                .to_string(),
        )
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_email_password(
        database: &crate::database::Database,
        email: &str,
        password: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.email = $1 AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(email)
        .bind(password)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM users
            WHERE $1 IS NULL OR users.username ILIKE '%' || $1 || '%' OR users.email ILIKE '%' || $1 || '%'
            ORDER BY users.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
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
            DELETE FROM users
            WHERE users.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn validate_password(
        &self,
        database: &crate::database::Database,
        password: &str,
    ) -> Result<bool, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.uuid = $1 AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(self.uuid)
        .bind(password)
        .fetch_optional(database.read())
        .await?;

        Ok(row.is_some())
    }

    pub async fn update_password(
        &self,
        database: &crate::database::Database,
        password: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE users
            SET password = crypt($2, gen_salt('bf'))
            WHERE users.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .bind(password)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self, show_personal: bool) -> ApiUser {
        ApiUser {
            uuid: self.uuid,
            username: self.username,
            avatar: self.avatar,
            email: if show_personal {
                self.email
            } else {
                "hidden@email.com".to_string()
            },
            name_first: if show_personal {
                self.name_first
            } else {
                "Hidden".to_string()
            },
            name_last: if show_personal {
                self.name_last
            } else {
                "User".to_string()
            },
            admin: self.admin,
            totp_enabled: self.totp_enabled,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "User")]
pub struct ApiUser {
    pub uuid: uuid::Uuid,

    pub avatar: Option<String>,
    pub username: String,
    pub email: String,

    pub name_first: String,
    pub name_last: String,

    pub admin: bool,
    pub totp_enabled: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
