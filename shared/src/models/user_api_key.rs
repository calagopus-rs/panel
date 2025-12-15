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
pub struct UserApiKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub key_start: compact_str::CompactString,

    pub user_permissions: Arc<Vec<compact_str::CompactString>>,
    pub admin_permissions: Arc<Vec<compact_str::CompactString>>,
    pub server_permissions: Arc<Vec<compact_str::CompactString>>,

    pub last_used: Option<chrono::NaiveDateTime>,
    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserApiKey {
    const NAME: &'static str = "user_api_key";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "user_api_keys.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "user_api_keys.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "user_api_keys.key_start",
                compact_str::format_compact!("{prefix}key_start"),
            ),
            (
                "user_api_keys.user_permissions",
                compact_str::format_compact!("{prefix}user_permissions"),
            ),
            (
                "user_api_keys.admin_permissions",
                compact_str::format_compact!("{prefix}admin_permissions"),
            ),
            (
                "user_api_keys.server_permissions",
                compact_str::format_compact!("{prefix}server_permissions"),
            ),
            (
                "user_api_keys.last_used",
                compact_str::format_compact!("{prefix}last_used"),
            ),
            (
                "user_api_keys.created",
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
            key_start: row.try_get(compact_str::format_compact!("{prefix}key_start").as_str())?,
            user_permissions: Arc::new(
                row.try_get(compact_str::format_compact!("{prefix}user_permissions").as_str())?,
            ),
            admin_permissions: Arc::new(
                row.try_get(compact_str::format_compact!("{prefix}admin_permissions").as_str())?,
            ),
            server_permissions: Arc::new(
                row.try_get(compact_str::format_compact!("{prefix}server_permissions").as_str())?,
            ),
            last_used: row.try_get(compact_str::format_compact!("{prefix}last_used").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl UserApiKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        user_permissions: &[compact_str::CompactString],
        admin_permissions: &[compact_str::CompactString],
        server_permissions: &[compact_str::CompactString],
    ) -> Result<(String, Self), crate::database::DatabaseError> {
        let key = format!(
            "c7sp_{}",
            rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 43)
        );

        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_api_keys (user_uuid, name, key_start, key, user_permissions, admin_permissions, server_permissions, created)
            VALUES ($1, $2, $3, crypt($4, gen_salt('xdes', 321)), $5, $6, $7, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(&key[0..16])
        .bind(&key)
        .bind(user_permissions)
        .bind(admin_permissions)
        .bind(server_permissions)
        .fetch_one(database.write())
        .await?;

        Ok((key, Self::map(None, &row)?))
    }

    pub async fn by_user_uuid_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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
    pub fn into_api_object(self) -> ApiUserApiKey {
        ApiUserApiKey {
            uuid: self.uuid,
            name: self.name,
            key_start: self.key_start,
            user_permissions: self.user_permissions,
            admin_permissions: self.admin_permissions,
            server_permissions: self.server_permissions,
            last_used: self.last_used.map(|dt| dt.and_utc()),
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for UserApiKey {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<UserApiKey>> =
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
            DELETE FROM user_api_keys
            WHERE user_api_keys.uuid = $1
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
#[schema(title = "UserApiKey")]
pub struct ApiUserApiKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub key_start: compact_str::CompactString,

    pub user_permissions: Arc<Vec<compact_str::CompactString>>,
    pub admin_permissions: Arc<Vec<compact_str::CompactString>>,
    pub server_permissions: Arc<Vec<compact_str::CompactString>>,

    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
    pub created: chrono::DateTime<chrono::Utc>,
}
