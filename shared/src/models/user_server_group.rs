use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserServerGroup {
    pub uuid: uuid::Uuid,
    pub name: String,
    pub order: i16,

    pub server_order: Vec<uuid::Uuid>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserServerGroup {
    const NAME: &'static str = "user_server_group";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("user_server_groups.uuid", format!("{prefix}uuid")),
            ("user_server_groups.name", format!("{prefix}name")),
            ("user_server_groups.order_", format!("{prefix}order")),
            (
                "user_server_groups.server_order",
                format!("{prefix}server_order"),
            ),
            ("user_server_groups.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            order: row.get(format!("{prefix}order").as_str()),
            server_order: row.get(format!("{prefix}server_order").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserServerGroup {
    pub async fn create(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        name: &str,
        server_order: &[uuid::Uuid],
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO user_server_groups (user_uuid, name, server_order)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(name)
        .bind(server_order)
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
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1 AND user_server_groups.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_by_user_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1
            ORDER BY user_server_groups.order_, user_server_groups.created
            "#,
            Self::columns_sql(None)
        ))
        .bind(user_uuid)
        .fetch_all(database.read())
        .await?;

        Ok(rows.into_iter().map(|row| Self::map(None, &row)).collect())
    }

    pub async fn count_by_user_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM user_server_groups
            WHERE user_server_groups.user_uuid = $1
            "#,
        )
        .bind(user_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM user_server_groups
            WHERE user_server_groups.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiUserServerGroup {
        ApiUserServerGroup {
            uuid: self.uuid,
            name: self.name,
            order: self.order,
            server_order: self.server_order,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "UserServerGroup")]
pub struct ApiUserServerGroup {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub order: i16,

    pub server_order: Vec<uuid::Uuid>,

    pub created: chrono::DateTime<chrono::Utc>,
}
