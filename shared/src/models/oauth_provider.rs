use crate::prelude::*;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct OAuthProvider {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub client_id: compact_str::CompactString,
    pub client_secret: Vec<u8>,
    pub auth_url: String,
    pub token_url: String,
    pub info_url: String,
    pub scopes: Vec<compact_str::CompactString>,

    pub identifier_path: String,
    pub email_path: Option<String>,
    pub username_path: Option<String>,
    pub name_first_path: Option<String>,
    pub name_last_path: Option<String>,

    pub enabled: bool,
    pub login_only: bool,
    pub link_viewable: bool,
    pub user_manageable: bool,
    pub basic_auth: bool,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for OAuthProvider {
    const NAME: &'static str = "oauth_provider";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "oauth_providers.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "oauth_providers.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "oauth_providers.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "oauth_providers.client_id",
                compact_str::format_compact!("{prefix}client_id"),
            ),
            (
                "oauth_providers.client_secret",
                compact_str::format_compact!("{prefix}client_secret"),
            ),
            (
                "oauth_providers.auth_url",
                compact_str::format_compact!("{prefix}auth_url"),
            ),
            (
                "oauth_providers.token_url",
                compact_str::format_compact!("{prefix}token_url"),
            ),
            (
                "oauth_providers.info_url",
                compact_str::format_compact!("{prefix}info_url"),
            ),
            (
                "oauth_providers.scopes",
                compact_str::format_compact!("{prefix}scopes"),
            ),
            (
                "oauth_providers.identifier_path",
                compact_str::format_compact!("{prefix}identifier_path"),
            ),
            (
                "oauth_providers.email_path",
                compact_str::format_compact!("{prefix}email_path"),
            ),
            (
                "oauth_providers.username_path",
                compact_str::format_compact!("{prefix}username_path"),
            ),
            (
                "oauth_providers.name_first_path",
                compact_str::format_compact!("{prefix}name_first_path"),
            ),
            (
                "oauth_providers.name_last_path",
                compact_str::format_compact!("{prefix}name_last_path"),
            ),
            (
                "oauth_providers.enabled",
                compact_str::format_compact!("{prefix}enabled"),
            ),
            (
                "oauth_providers.login_only",
                compact_str::format_compact!("{prefix}login_only"),
            ),
            (
                "oauth_providers.link_viewable",
                compact_str::format_compact!("{prefix}link_viewable"),
            ),
            (
                "oauth_providers.user_manageable",
                compact_str::format_compact!("{prefix}user_manageable"),
            ),
            (
                "oauth_providers.basic_auth",
                compact_str::format_compact!("{prefix}basic_auth"),
            ),
            (
                "oauth_providers.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            description: row
                .try_get(compact_str::format_compact!("{prefix}description").as_str())?,
            client_id: row.try_get(compact_str::format_compact!("{prefix}client_id").as_str())?,
            client_secret: row
                .try_get(compact_str::format_compact!("{prefix}client_secret").as_str())?,
            auth_url: row.try_get(compact_str::format_compact!("{prefix}auth_url").as_str())?,
            token_url: row.try_get(compact_str::format_compact!("{prefix}token_url").as_str())?,
            info_url: row.try_get(compact_str::format_compact!("{prefix}info_url").as_str())?,
            scopes: row.try_get(compact_str::format_compact!("{prefix}scopes").as_str())?,
            identifier_path: row
                .try_get(compact_str::format_compact!("{prefix}identifier_path").as_str())?,
            email_path: row.try_get(compact_str::format_compact!("{prefix}email_path").as_str())?,
            username_path: row
                .try_get(compact_str::format_compact!("{prefix}username_path").as_str())?,
            name_first_path: row
                .try_get(compact_str::format_compact!("{prefix}name_first_path").as_str())?,
            name_last_path: row
                .try_get(compact_str::format_compact!("{prefix}name_last_path").as_str())?,
            enabled: row.try_get(compact_str::format_compact!("{prefix}enabled").as_str())?,
            login_only: row.try_get(compact_str::format_compact!("{prefix}login_only").as_str())?,
            link_viewable: row
                .try_get(compact_str::format_compact!("{prefix}link_viewable").as_str())?,
            user_manageable: row
                .try_get(compact_str::format_compact!("{prefix}user_manageable").as_str())?,
            basic_auth: row.try_get(compact_str::format_compact!("{prefix}basic_auth").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl OAuthProvider {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        client_id: &str,
        client_secret: &str,
        auth_url: &str,
        token_url: &str,
        info_url: &str,
        scopes: &[compact_str::CompactString],
        identifier_path: &str,
        email_path: Option<&str>,
        username_path: Option<&str>,
        name_first_path: Option<&str>,
        name_last_path: Option<&str>,
        enabled: bool,
        login_only: bool,
        link_viewable: bool,
        user_manageable: bool,
        basic_auth: bool,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO oauth_providers (
                name, description, client_id, client_secret, auth_url,
                token_url, info_url, scopes, identifier_path, email_path,
                username_path, name_first_path, name_last_path, enabled,
                login_only, link_viewable, user_manageable, basic_auth
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(name)
        .bind(description)
        .bind(client_id)
        .bind(
            database
                .encrypt(client_secret.to_string())
                .await
                .map_err(|err| sqlx::Error::Encode(err.into()))?,
        )
        .bind(auth_url)
        .bind(token_url)
        .bind(info_url)
        .bind(scopes)
        .bind(identifier_path)
        .bind(email_path)
        .bind(username_path)
        .bind(name_first_path)
        .bind(name_last_path)
        .bind(enabled)
        .bind(login_only)
        .bind(link_viewable)
        .bind(user_manageable)
        .bind(basic_auth)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
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
            FROM oauth_providers
            WHERE ($1 IS NULL OR oauth_providers.name ILIKE '%' || $1 || '%')
            ORDER BY oauth_providers.created
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

    pub async fn all_by_usable(
        database: &crate::database::Database,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM oauth_providers
            WHERE oauth_providers.enabled = true
            ORDER BY oauth_providers.created
            "#,
            Self::columns_sql(None)
        ))
        .fetch_all(database.read())
        .await?;

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
    }

    pub fn extract_identifier(&self, value: &serde_json::Value) -> Result<String, anyhow::Error> {
        Ok(
            match serde_json_path::JsonPath::parse(&self.identifier_path)?
                .query(value)
                .first()
                .ok_or_else(|| {
                    crate::response::DisplayError::new(format!(
                        "unable to extract identifier from {:?}",
                        value
                    ))
                })? {
                serde_json::Value::String(string) => string.clone(),
                val => val.to_string(),
            },
        )
    }

    pub fn extract_email(&self, value: &serde_json::Value) -> Result<String, anyhow::Error> {
        Ok(serde_json_path::JsonPath::parse(match &self.email_path {
            Some(path) => path,
            None => {
                return Err(crate::response::DisplayError::new(
                    "no email path defined, unable to register",
                )
                .into());
            }
        })?
        .query(value)
        .first()
        .ok_or_else(|| {
            crate::response::DisplayError::new(format!("unable to extract email from {:?}", value))
        })?
        .to_string())
    }

    pub fn extract_username(&self, value: &serde_json::Value) -> Result<String, anyhow::Error> {
        Ok(serde_json_path::JsonPath::parse(match &self.username_path {
            Some(path) => path,
            None => return Ok(rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 10)),
        })?
        .query(value)
        .first()
        .ok_or_else(|| {
            crate::response::DisplayError::new(format!(
                "unable to extract username from {:?}",
                value
            ))
        })?
        .to_string())
    }

    pub fn extract_name_first(&self, value: &serde_json::Value) -> Result<String, anyhow::Error> {
        Ok(
            serde_json_path::JsonPath::parse(match &self.name_first_path {
                Some(path) => path,
                None => return Ok("First".to_string()),
            })?
            .query(value)
            .first()
            .ok_or_else(|| {
                crate::response::DisplayError::new(format!(
                    "unable to extract first name from {:?}",
                    value
                ))
            })?
            .to_string(),
        )
    }

    pub fn extract_name_last(&self, value: &serde_json::Value) -> Result<String, anyhow::Error> {
        Ok(
            serde_json_path::JsonPath::parse(match &self.name_last_path {
                Some(path) => path,
                None => return Ok("Last".to_string()),
            })?
            .query(value)
            .first()
            .ok_or_else(|| {
                crate::response::DisplayError::new(format!(
                    "unable to extract last name from {:?}",
                    value
                ))
            })?
            .to_string(),
        )
    }

    #[inline]
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiOAuthProvider, anyhow::Error> {
        Ok(AdminApiOAuthProvider {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            client_id: self.client_id,
            client_secret: database.decrypt(self.client_secret).await?,
            auth_url: self.auth_url,
            token_url: self.token_url,
            info_url: self.info_url,
            scopes: self.scopes,
            identifier_path: self.identifier_path,
            email_path: self.email_path,
            username_path: self.username_path,
            name_first_path: self.name_first_path,
            name_last_path: self.name_last_path,
            enabled: self.enabled,
            login_only: self.login_only,
            link_viewable: self.link_viewable,
            user_manageable: self.user_manageable,
            basic_auth: self.basic_auth,
            created: self.created.and_utc(),
        })
    }

    #[inline]
    pub fn into_api_object(self) -> ApiOAuthProvider {
        ApiOAuthProvider {
            uuid: self.uuid,
            name: self.name,
            link_viewable: self.link_viewable,
            user_manageable: self.user_manageable,
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for OAuthProvider {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM oauth_providers
            WHERE oauth_providers.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[async_trait::async_trait]
impl DeletableModel for OAuthProvider {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<OAuthProvider>> =
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
            DELETE FROM oauth_providers
            WHERE oauth_providers.uuid = $1
            "#,
        )
        .bind(self.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminOAuthProvider")]
pub struct AdminApiOAuthProvider {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub client_id: compact_str::CompactString,
    pub client_secret: compact_str::CompactString,
    pub auth_url: String,
    pub token_url: String,
    pub info_url: String,
    pub scopes: Vec<compact_str::CompactString>,

    pub identifier_path: String,
    pub email_path: Option<String>,
    pub username_path: Option<String>,
    pub name_first_path: Option<String>,
    pub name_last_path: Option<String>,

    pub enabled: bool,
    pub login_only: bool,
    pub link_viewable: bool,
    pub user_manageable: bool,
    pub basic_auth: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "OAuthProvider")]
pub struct ApiOAuthProvider {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,

    pub link_viewable: bool,
    pub user_manageable: bool,
}
