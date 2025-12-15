use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserSshKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub fingerprint: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserSshKey {
    const NAME: &'static str = "user_ssh_key";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "user_ssh_keys.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "user_ssh_keys.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "user_ssh_keys.fingerprint",
                compact_str::format_compact!("{prefix}fingerprint"),
            ),
            (
                "user_ssh_keys.created",
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
            fingerprint: row
                .try_get(compact_str::format_compact!("{prefix}fingerprint").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl UserSshKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        public_key: russh::keys::PublicKey,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_ssh_keys (user_uuid, name, fingerprint, public_key, created)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(
            public_key
                .fingerprint(russh::keys::HashAlg::Sha256)
                .to_string(),
        )
        .bind(public_key.to_bytes().map_err(anyhow::Error::new)?)
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
            FROM user_ssh_keys
            WHERE user_ssh_keys.user_uuid = $1 AND user_ssh_keys.uuid = $2
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
            FROM user_ssh_keys
            WHERE user_ssh_keys.user_uuid = $1 AND ($2 IS NULL OR user_ssh_keys.name ILIKE '%' || $2 || '%')
            ORDER BY user_ssh_keys.created
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
    pub fn into_api_object(self) -> ApiUserSshKey {
        ApiUserSshKey {
            uuid: self.uuid,
            name: self.name,
            fingerprint: self.fingerprint,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl DeletableModel for UserSshKey {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<UserSshKey>> =
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
            DELETE FROM user_ssh_keys
            WHERE user_ssh_keys.uuid = $1
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
#[schema(title = "UserSshKey")]
pub struct ApiUserSshKey {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub fingerprint: String,

    pub created: chrono::DateTime<chrono::Utc>,
}
