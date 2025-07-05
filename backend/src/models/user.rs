use super::BaseModel;
use crate::routes::api::client::{AuthMethod, GetAuthMethod};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, sync::LazyLock};
use utoipa::ToSchema;

pub static USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-zA-Z0-9_]+$").expect("Failed to compile username regex"));

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
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
            (format!("{}.id", table), format!("{}id", prefix)),
            (
                format!("{}.external_id", table),
                format!("{}external_id", prefix),
            ),
            (format!("{}.avatar", table), format!("{}avatar", prefix)),
            (format!("{}.username", table), format!("{}username", prefix)),
            (format!("{}.email", table), format!("{}email", prefix)),
            (
                format!("{}.name_first", table),
                format!("{}name_first", prefix),
            ),
            (
                format!("{}.name_last", table),
                format!("{}name_last", prefix),
            ),
            (format!("{}.admin", table), format!("{}admin", prefix)),
            (
                format!("{}.totp_enabled", table),
                format!("{}totp_enabled", prefix),
            ),
            (
                format!("{}.totp_secret", table),
                format!("{}totp_secret", prefix),
            ),
            (format!("{}.created", table), format!("{}created", prefix)),
            (format!("{}.created", table), format!("{}created", prefix)),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            external_id: row.get(format!("{}external_id", prefix).as_str()),
            avatar: row.get(format!("{}avatar", prefix).as_str()),
            username: row.get(format!("{}username", prefix).as_str()),
            email: row.get(format!("{}email", prefix).as_str()),
            name_first: row.get(format!("{}name_first", prefix).as_str()),
            name_last: row.get(format!("{}name_last", prefix).as_str()),
            admin: row.get(format!("{}admin", prefix).as_str()),
            totp_enabled: row.get(format!("{}totp_enabled", prefix).as_str()),
            totp_secret: row.get(format!("{}totp_secret", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
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
            VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6)
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

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_session(
        database: &crate::database::Database,
        session: &str,
    ) -> Option<(Self, super::user_session::UserSession)> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            JOIN user_sessions ON user_sessions.user_id = users.id
            WHERE user_sessions.key = crypt($1, user_sessions.key)
            "#,
            Self::columns_sql(None, None),
            super::user_session::UserSession::columns_sql(Some("session_"), None)
        ))
        .bind(session)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| {
            (
                Self::map(None, &row),
                super::user_session::UserSession::map(Some("session_"), &row),
            )
        })
    }

    pub async fn by_api_key(
        database: &crate::database::Database,
        key: &str,
    ) -> Option<(Self, super::user_api_key::UserApiKey)> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            JOIN user_api_keys ON user_api_keys.user_id = users.id
            WHERE user_api_keys.key = crypt($1, user_api_keys.key)
            "#,
            Self::columns_sql(None, None),
            super::user_api_key::UserApiKey::columns_sql(Some("api_key_"), None)
        ))
        .bind(key)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| {
            (
                Self::map(None, &row),
                super::user_api_key::UserApiKey::map(Some("api_key_"), &row),
            )
        })
    }

    pub async fn by_username(
        database: &crate::database::Database,
        cache: &crate::cache::Cache,
        username: &str,
    ) -> Option<Self> {
        cache
            .cached(&format!("user::{}", username), 3600, || async {
                let row = sqlx::query(&format!(
                    r#"
                    SELECT {}
                    FROM users
                    WHERE users.username = $1
                    "#,
                    Self::columns_sql(None, None)
                ))
                .bind(username)
                .fetch_optional(database.read())
                .await
                .unwrap();

                row.map(|row| Self::map(None, &row))
            })
            .await
    }

    pub async fn by_username_password(
        database: &crate::database::Database,
        username: &str,
        password: &str,
    ) -> Option<Self> {
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
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_username_public_key(
        database: &crate::database::Database,
        username: &str,
        public_key: russh::keys::PublicKey,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            JOIN user_ssh_keys ON user_ssh_keys.user_id = users.id
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
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_email_password(
        database: &crate::database::Database,
        email: &str,
        password: &str,
    ) -> Option<Self> {
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
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM users
            WHERE users.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    pub async fn log_activity(
        &self,
        database: &crate::database::Database,
        event: &str,
        ip: crate::GetIp,
        auth: GetAuthMethod,
        data: serde_json::Value,
    ) {
        if let Err(err) = super::user_activity::UserActivity::log(
            database,
            self.id,
            match auth.0 {
                AuthMethod::ApiKey(api_key) => Some(api_key.id),
                _ => None,
            },
            event,
            ip.0.into(),
            data,
        )
        .await
        {
            tracing::warn!(user = self.id, "failed to log user activity: {:#?}", err);
        }
    }

    pub async fn validate_password(
        &self,
        database: &crate::database::Database,
        password: &str,
    ) -> bool {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            WHERE users.id = $1 AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(self.id)
        .bind(password)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.is_some()
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
            WHERE users.id = $1
            "#,
        )
        .bind(self.id)
        .bind(password)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn to_uuid(&self) -> uuid::Uuid {
        uuid::Uuid::from_fields(
            self.id as u32,
            (self.id >> 16) as u16,
            self.id as u16,
            &[0; 8],
        )
    }

    #[inline]
    pub fn from_uuid(uuid: uuid::Uuid) -> i32 {
        uuid.as_fields().0 as i32
    }

    #[inline]
    pub fn into_api_object(self, show_personal: bool) -> ApiUser {
        ApiUser {
            id: self.id,
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
    pub id: i32,

    pub avatar: Option<String>,
    pub username: String,
    pub email: String,

    pub name_first: String,
    pub name_last: String,

    pub admin: bool,
    pub totp_enabled: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
