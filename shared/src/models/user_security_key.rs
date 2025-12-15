use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserSecurityKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,

    pub passkey: Option<webauthn_rs::prelude::Passkey>,
    pub registration: Option<webauthn_rs::prelude::PasskeyRegistration>,

    pub last_used: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserSecurityKey {
    const NAME: &'static str = "user_security_key";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "user_security_keys.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "user_security_keys.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "user_security_keys.passkey",
                compact_str::format_compact!("{prefix}passkey"),
            ),
            (
                "user_security_keys.registration",
                compact_str::format_compact!("{prefix}registration"),
            ),
            (
                "user_security_keys.last_used",
                compact_str::format_compact!("{prefix}last_used"),
            ),
            (
                "user_security_keys.created",
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
            passkey: if row
                .try_get::<serde_json::Value, _>(
                    compact_str::format_compact!("{prefix}passkey").as_str(),
                )
                .is_ok()
            {
                serde_json::from_value(
                    row.try_get(compact_str::format_compact!("{prefix}passkey").as_str())?,
                )
                .ok()
            } else {
                None
            },
            registration: if row
                .try_get::<serde_json::Value, _>(
                    compact_str::format_compact!("{prefix}registration").as_str(),
                )
                .is_ok()
            {
                serde_json::from_value(
                    row.try_get(compact_str::format_compact!("{prefix}registration").as_str())?,
                )
                .ok()
            } else {
                None
            },
            last_used: row.try_get(compact_str::format_compact!("{prefix}last_used").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl UserSecurityKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        registration: webauthn_rs::prelude::PasskeyRegistration,
    ) -> Result<Self, crate::database::DatabaseError> {
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
        .bind(serde_json::to_value(registration)?)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_user_uuid_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_user_uuid_with_pagination(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
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

#[async_trait::async_trait]
impl DeletableModel for UserSecurityKey {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<UserSecurityKey>> =
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
            DELETE FROM user_security_keys
            WHERE user_security_keys.uuid = $1
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
#[schema(title = "UserSecurityKey")]
pub struct ApiUserSecurityKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,

    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
