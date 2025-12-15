use crate::{prelude::*, response::ApiResponse, storage::StorageUrlRetriever};
use axum::http::StatusCode;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;
use webauthn_rs::prelude::CredentialID;

pub static USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-zA-Z0-9_]+$").expect("Failed to compile username regex"));

#[derive(Clone)]
pub enum AuthMethod {
    Session(super::user_session::UserSession),
    ApiKey(super::user_api_key::UserApiKey),
}

pub type GetUser = crate::extract::ConsumingExtension<User>;
pub type GetAuthMethod = crate::extract::ConsumingExtension<AuthMethod>;
pub type GetPermissionManager = axum::extract::Extension<PermissionManager>;

#[derive(Clone)]
pub struct PermissionManager {
    user_admin: bool,
    role_admin_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    role_server_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    api_key_user_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    api_key_admin_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    api_key_server_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    server_subuser_permissions: Option<Arc<Vec<compact_str::CompactString>>>,
}

impl PermissionManager {
    pub fn new(user: &User) -> Self {
        Self {
            user_admin: user.admin,
            role_admin_permissions: user.role.as_ref().map(|r| r.admin_permissions.clone()),
            role_server_permissions: user.role.as_ref().map(|r| r.server_permissions.clone()),
            api_key_user_permissions: None,
            api_key_admin_permissions: None,
            api_key_server_permissions: None,
            server_subuser_permissions: None,
        }
    }

    pub fn add_api_key(mut self, api_key: &super::user_api_key::UserApiKey) -> Self {
        self.api_key_user_permissions = Some(api_key.user_permissions.clone());
        self.api_key_admin_permissions = Some(api_key.admin_permissions.clone());
        self.api_key_server_permissions = Some(api_key.server_permissions.clone());

        self
    }

    pub fn add_subuser_permissions(
        mut self,
        permissions: Option<Arc<Vec<compact_str::CompactString>>>,
    ) -> Self {
        self.server_subuser_permissions = permissions;

        self
    }

    pub fn has_user_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if let Some(permissions) = &self.api_key_user_permissions {
            if permissions.iter().any(|p| p == permission) {
                return Ok(());
            } else {
                return Err(ApiResponse::error(&format!(
                    "you do not have permission to perform this action: {permission}"
                ))
                .with_status(StatusCode::FORBIDDEN));
            }
        }

        Ok(())
    }

    pub fn has_admin_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if self.user_admin {
            return Ok(());
        }

        let has_role_permission = if let Some(permissions) = &self.role_admin_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        if !has_role_permission {
            return Err(ApiResponse::error(&format!(
                "you do not have permission to perform this action: {permission}"
            ))
            .with_status(StatusCode::FORBIDDEN));
        }

        if let Some(permissions) = &self.api_key_admin_permissions
            && !permissions.iter().any(|p| p == permission)
        {
            return Err(ApiResponse::error(&format!(
                "you do not have permission to perform this action: {permission}"
            ))
            .with_status(StatusCode::FORBIDDEN));
        }

        Ok(())
    }

    pub fn has_server_permission(&self, permission: &str) -> Result<(), ApiResponse> {
        if self.user_admin {
            return Ok(());
        }

        if self.server_subuser_permissions.is_none() && self.role_server_permissions.is_none() {
            if let Some(api_key_permissions) = &self.api_key_server_permissions
                && api_key_permissions.iter().all(|p| p != permission)
            {
                return Err(ApiResponse::error(&format!(
                    "you do not have permission to perform this action: {permission}"
                ))
                .with_status(StatusCode::FORBIDDEN));
            }

            return Ok(());
        }

        let has_role_permission = if let Some(permissions) = &self.role_server_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        let has_subuser_permission = if let Some(permissions) = &self.server_subuser_permissions {
            permissions.iter().any(|p| p == permission)
        } else {
            false
        };

        let has_base_permission = has_role_permission || has_subuser_permission;

        if !has_base_permission {
            return Err(ApiResponse::error(&format!(
                "you do not have permission to perform this action: {permission}"
            ))
            .with_status(StatusCode::FORBIDDEN));
        }

        if let Some(api_key_permissions) = &self.api_key_server_permissions
            && !api_key_permissions.iter().any(|p| p == permission)
        {
            return Err(ApiResponse::error(&format!(
                "you do not have permission to perform this action: {permission}"
            ))
            .with_status(StatusCode::FORBIDDEN));
        }

        Ok(())
    }
}

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "snake_case")]
#[schema(rename_all = "snake_case")]
#[sqlx(type_name = "user_toast_position", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserToastPosition {
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub uuid: uuid::Uuid,
    pub role: Option<super::role::Role>,
    pub external_id: Option<compact_str::CompactString>,

    pub avatar: Option<String>,
    pub username: compact_str::CompactString,
    pub email: compact_str::CompactString,

    pub name_first: compact_str::CompactString,
    pub name_last: compact_str::CompactString,

    pub admin: bool,
    pub totp_enabled: bool,
    pub totp_secret: Option<String>,

    pub language: compact_str::CompactString,
    pub toast_position: UserToastPosition,
    pub start_on_grouped_servers: bool,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for User {
    const NAME: &'static str = "user";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            ("users.uuid", compact_str::format_compact!("{prefix}uuid")),
            (
                "users.external_id",
                compact_str::format_compact!("{prefix}external_id"),
            ),
            (
                "users.avatar",
                compact_str::format_compact!("{prefix}avatar"),
            ),
            (
                "users.username",
                compact_str::format_compact!("{prefix}username"),
            ),
            ("users.email", compact_str::format_compact!("{prefix}email")),
            (
                "users.name_first",
                compact_str::format_compact!("{prefix}name_first"),
            ),
            (
                "users.name_last",
                compact_str::format_compact!("{prefix}name_last"),
            ),
            ("users.admin", compact_str::format_compact!("{prefix}admin")),
            (
                "users.totp_enabled",
                compact_str::format_compact!("{prefix}totp_enabled"),
            ),
            (
                "users.totp_secret",
                compact_str::format_compact!("{prefix}totp_secret"),
            ),
            (
                "users.language",
                compact_str::format_compact!("{prefix}language"),
            ),
            (
                "users.toast_position",
                compact_str::format_compact!("{prefix}toast_position"),
            ),
            (
                "users.start_on_grouped_servers",
                compact_str::format_compact!("{prefix}start_on_grouped_servers"),
            ),
            (
                "users.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ]);

        columns.extend(super::role::Role::columns(Some("role_")));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            role: if row
                .try_get::<uuid::Uuid, _>(
                    compact_str::format_compact!("{prefix}role_uuid").as_str(),
                )
                .is_ok()
            {
                Some(super::role::Role::map(Some("role_"), row)?)
            } else {
                None
            },
            external_id: row
                .try_get(compact_str::format_compact!("{prefix}external_id").as_str())?,
            avatar: row.try_get(compact_str::format_compact!("{prefix}avatar").as_str())?,
            username: row.try_get(compact_str::format_compact!("{prefix}username").as_str())?,
            email: row.try_get(compact_str::format_compact!("{prefix}email").as_str())?,
            name_first: row.try_get(compact_str::format_compact!("{prefix}name_first").as_str())?,
            name_last: row.try_get(compact_str::format_compact!("{prefix}name_last").as_str())?,
            admin: row.try_get(compact_str::format_compact!("{prefix}admin").as_str())?,
            totp_enabled: row
                .try_get(compact_str::format_compact!("{prefix}totp_enabled").as_str())?,
            totp_secret: row
                .try_get(compact_str::format_compact!("{prefix}totp_secret").as_str())?,
            language: row.try_get(compact_str::format_compact!("{prefix}language").as_str())?,
            toast_position: row
                .try_get(compact_str::format_compact!("{prefix}toast_position").as_str())?,
            start_on_grouped_servers: row.try_get(
                compact_str::format_compact!("{prefix}start_on_grouped_servers").as_str(),
            )?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl User {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        role_uuid: Option<uuid::Uuid>,
        external_id: Option<&str>,
        username: &str,
        email: &str,
        name_first: &str,
        name_last: &str,
        password: &str,
        admin: bool,
        language: &str,
    ) -> Result<uuid::Uuid, crate::database::DatabaseError> {
        let row = sqlx::query(
            r#"
            INSERT INTO users (role_uuid, external_id, username, email, name_first, name_last, password, admin, language)
            VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf', 8)), $8, $9)
            RETURNING users.uuid
            "#,
        )
        .bind(role_uuid)
        .bind(external_id)
        .bind(username)
        .bind(email)
        .bind(name_first)
        .bind(name_last)
        .bind(password)
        .bind(admin)
        .bind(language)
        .fetch_one(database.write())
        .await?;

        Ok(row.try_get("uuid")?)
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn create_automatic_admin(
        database: &crate::database::Database,
        role_uuid: Option<uuid::Uuid>,
        external_id: Option<&str>,
        username: &str,
        email: &str,
        name_first: &str,
        name_last: &str,
        password: &str,
    ) -> Result<uuid::Uuid, crate::database::DatabaseError> {
        let row = sqlx::query(
            r#"
            INSERT INTO users (role_uuid, external_id, username, email, name_first, name_last, password, admin)
            VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf', 8)), (SELECT COUNT(*) = 0 FROM users))
            RETURNING users.uuid
            "#,
        )
        .bind(role_uuid)
        .bind(external_id)
        .bind(username)
        .bind(email)
        .bind(name_first)
        .bind(name_last)
        .bind(password)
        .fetch_one(database.write())
        .await?;

        Ok(row.try_get("uuid")?)
    }

    pub async fn by_external_id(
        database: &crate::database::Database,
        external_id: &str,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            JOIN user_security_keys ON user_security_keys.user_uuid = users.uuid
            WHERE users.external_id = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(external_id)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_session_cached(
        database: &crate::database::Database,
        session: &str,
    ) -> Result<Option<(Self, super::user_session::UserSession)>, anyhow::Error> {
        let (key_id, key) = match session.split_once(':') {
            Some((key_id, key)) => (key_id, key),
            None => return Ok(None),
        };

        database
            .cache
            .cached(&format!("user::session::{session}"), 5, || async {
                let row = sqlx::query(&format!(
                    r#"
                    SELECT {}, {}
                    FROM users
                    LEFT JOIN roles ON roles.uuid = users.role_uuid
                    JOIN user_sessions ON user_sessions.user_uuid = users.uuid
                    WHERE user_sessions.key_id = $1 AND user_sessions.key = crypt($2, user_sessions.key)
                    "#,
                    Self::columns_sql(None),
                    super::user_session::UserSession::columns_sql(Some("session_"))
                ))
                .bind(key_id)
                .bind(key)
                .fetch_optional(database.read())
                .await?;

                row.try_map(|row| {
                    Ok::<_, anyhow::Error>((
                        Self::map(None, &row)?,
                        super::user_session::UserSession::map(Some("session_"), &row)?,
                    ))
                })
            })
            .await
    }

    pub async fn by_api_key_cached(
        database: &crate::database::Database,
        key: &str,
    ) -> Result<Option<(Self, super::user_api_key::UserApiKey)>, anyhow::Error> {
        database
            .cache
            .cached(&format!("user::api_key::{key}"), 5, || async {
                let row = sqlx::query(&format!(
                    r#"
                    SELECT {}, {}
                    FROM users
                    LEFT JOIN roles ON roles.uuid = users.role_uuid
                    JOIN user_api_keys ON user_api_keys.user_uuid = users.uuid
                    WHERE user_api_keys.key_start = $1 AND user_api_keys.key = crypt($2, user_api_keys.key)
                    "#,
                    Self::columns_sql(None),
                    super::user_api_key::UserApiKey::columns_sql(Some("api_key_"))
                ))
                .bind(&key[0..16])
                .bind(key)
                .fetch_optional(database.read())
                .await?;

                row.try_map(|row| {
                    Ok::<_, anyhow::Error>((
                        Self::map(None, &row)?,
                        super::user_api_key::UserApiKey::map(Some("api_key_"), &row)?,
                    ))
                })
            })
            .await
    }

    pub async fn by_credential_id(
        database: &crate::database::Database,
        credential_id: &CredentialID,
    ) -> Result<
        Option<(Self, super::user_security_key::UserSecurityKey)>,
        crate::database::DatabaseError,
    > {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            JOIN user_security_keys ON user_security_keys.user_uuid = users.uuid
            WHERE user_security_keys.credential_id = $1
            "#,
            Self::columns_sql(None),
            super::user_security_key::UserSecurityKey::columns_sql(Some("security_key_"))
        ))
        .bind(credential_id.to_vec())
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| {
            Ok((
                Self::map(None, &row)?,
                super::user_security_key::UserSecurityKey::map(Some("security_key_"), &row)?,
            ))
        })
    }

    pub async fn by_email(
        database: &crate::database::Database,
        email: &str,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE lower(users.email) = lower($1)
            "#,
            Self::columns_sql(None)
        ))
        .bind(email)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_username_password(
        database: &crate::database::Database,
        username: &str,
        password: &str,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE lower(users.username) = lower($1) AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None)
        ))
        .bind(username)
        .bind(password)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_username_public_key(
        database: &crate::database::Database,
        username: &str,
        public_key: russh::keys::PublicKey,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            JOIN user_ssh_keys ON user_ssh_keys.user_uuid = users.uuid
            WHERE lower(users.username) = lower($1) AND user_ssh_keys.fingerprint = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(username)
        .bind(
            public_key
                .fingerprint(russh::keys::HashAlg::Sha256)
                .to_string(),
        )
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_email_password(
        database: &crate::database::Database,
        email: &str,
        password: &str,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE lower(users.email) = lower($1) AND users.password = crypt($2, users.password)
            "#,
            Self::columns_sql(None)
        ))
        .bind(email)
        .bind(password)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_role_uuid_with_pagination(
        database: &crate::database::Database,
        role_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE users.role_uuid = $1 AND ($2 IS NULL OR users.username ILIKE '%' || $2 || '%' OR users.email ILIKE '%' || $2 || '%')
            ORDER BY users.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(role_uuid)
        .bind(search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await?;

        Ok(super::Pagination {
            total: rows
                .first()
                .map_or(Ok(0), |row| row.try_get("total_count"))?,
            per_page,
            page,
            data: rows
                .into_iter()
                .map(|row| Self::map(None, &row))
                .try_collect_vec()?,
        })
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE $1 IS NULL OR users.username ILIKE '%' || $1 || '%' OR users.email ILIKE '%' || $1 || '%'
            ORDER BY users.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None)
        ))
        .bind(search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await?;

        Ok(super::Pagination {
            total: rows
                .first()
                .map_or(Ok(0), |row| row.try_get("total_count"))?,
            per_page,
            page,
            data: rows
                .into_iter()
                .map(|row| Self::map(None, &row))
                .try_collect_vec()?,
        })
    }

    pub async fn count(database: &crate::database::Database) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM users
            "#,
        )
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn validate_password(
        &self,
        database: &crate::database::Database,
        password: &str,
    ) -> Result<bool, crate::database::DatabaseError> {
        let row = sqlx::query(
            r#"
            SELECT 1
            FROM users
            WHERE users.uuid = $1 AND users.password = crypt($2, users.password)
            "#,
        )
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
    ) -> Result<(), crate::database::DatabaseError> {
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
    pub fn into_api_object(self, storage_url_retriever: &StorageUrlRetriever<'_>) -> ApiUser {
        ApiUser {
            uuid: self.uuid,
            username: self.username,
            role: self.role.map(|r| r.name),
            avatar: self
                .avatar
                .as_ref()
                .map(|a| storage_url_retriever.get_url(a)),
            admin: self.admin,
            totp_enabled: self.totp_enabled,
            created: self.created.and_utc(),
        }
    }

    #[inline]
    pub fn into_api_full_object(
        self,
        storage_url_retriever: &StorageUrlRetriever<'_>,
    ) -> ApiFullUser {
        ApiFullUser {
            uuid: self.uuid,
            username: self.username,
            role: self.role.map(|r| r.into_admin_api_object()),
            avatar: self
                .avatar
                .as_ref()
                .map(|a| storage_url_retriever.get_url(a)),
            email: self.email,
            name_first: self.name_first,
            name_last: self.name_last,
            admin: self.admin,
            totp_enabled: self.totp_enabled,
            language: self.language,
            toast_position: self.toast_position,
            start_on_grouped_servers: self.start_on_grouped_servers,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for User {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<User>> =
            LazyLock::new(|| Arc::new(ListenerList::default()));

        &DELETE_LISTENERS
    }

    async fn delete(
        &self,
        database: &Arc<crate::database::Database>,
        options: Self::DeleteOptions,
    ) -> Result<(), anyhow::Error> {
        let mut transaction = database.write().begin().await?;

        self.run_delete_listeners(&options, database, &mut transaction)
            .await?;

        sqlx::query(
            r#"
            DELETE FROM users
            WHERE users.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[async_trait::async_trait]
impl ByUuid for User {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM users
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE users.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "User")]
pub struct ApiUser {
    pub uuid: uuid::Uuid,

    pub username: compact_str::CompactString,
    pub role: Option<compact_str::CompactString>,
    pub avatar: Option<String>,

    pub admin: bool,
    pub totp_enabled: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "FullUser")]
pub struct ApiFullUser {
    pub uuid: uuid::Uuid,

    pub username: compact_str::CompactString,
    pub role: Option<super::role::AdminApiRole>,
    pub avatar: Option<String>,
    pub email: compact_str::CompactString,

    pub name_first: compact_str::CompactString,
    pub name_last: compact_str::CompactString,

    pub admin: bool,
    pub totp_enabled: bool,

    pub language: compact_str::CompactString,
    pub toast_position: UserToastPosition,
    pub start_on_grouped_servers: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
