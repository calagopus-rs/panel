use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct UserSshKey {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub fingerprint: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserSshKey {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("user_ssh_keys.uuid", format!("{prefix}uuid")),
            ("user_ssh_keys.name", format!("{prefix}name")),
            ("user_ssh_keys.fingerprint", format!("{prefix}fingerprint")),
            ("user_ssh_keys.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            fingerprint: row.get(format!("{prefix}fingerprint").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserSshKey {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        public_key: russh::keys::PublicKey,
    ) -> Result<Self, sqlx::Error> {
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
        .bind(public_key.to_bytes().unwrap())
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
            FROM user_ssh_keys
            WHERE user_ssh_keys.user_uuid = $1 AND user_ssh_keys.uuid = $2
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
            DELETE FROM user_ssh_keys
            WHERE user_ssh_keys.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
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

#[derive(ToSchema, Serialize)]
#[schema(title = "UserSshKey")]
pub struct ApiUserSshKey {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub fingerprint: String,

    pub created: chrono::DateTime<chrono::Utc>,
}
