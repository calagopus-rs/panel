use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerSubuser {
    pub user: super::user::User,

    pub permissions: Vec<String>,

    pub created: NaiveDateTime,
}

impl BaseModel for ServerSubuser {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("server_subusers");

        let mut columns = BTreeMap::from([
            (
                format!("{}.user_id", table),
                format!("{}user_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.permissions", table),
                format!("{}permissions", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ]);

        columns.extend(super::user::User::columns(Some("user_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            user: super::user::User::map(Some("user_"), row),
            permissions: row.get(format!("{}permissions", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl ServerSubuser {
    pub async fn new(
        database: &crate::database::Database,
        server_id: i32,
        user_id: i32,
        permissions: &[String],
    ) -> bool {
        sqlx::query(
            r#"
            INSERT INTO server_subusers (server_id, user_id, permissions)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(server_id)
        .bind(user_id)
        .bind(permissions)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn all_by_server_id_with_pagination(
        database: &crate::database::Database,
        server_id: i32,
        page: i64,
        per_page: i64,
    ) -> Vec<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM server_subusers
            JOIN users ON users.id = server_subusers.user_id
            WHERE server_subusers.server_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::user::User::columns_sql(Some("user_"), None)
        ))
        .bind(server_id)
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    pub async fn delete_by_ids(database: &crate::database::Database, server_id: i32, ids: &[i32]) {
        sqlx::query(
            r#"
            DELETE FROM server_subusers
            WHERE
                server_subusers.server_id = $1
                AND server_subusers.user_id = ANY($2)
            "#,
        )
        .bind(server_id)
        .bind(ids)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerSubuser {
        ApiServerSubuser {
            user: self.user.into_api_object(false),
            permissions: self.permissions,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerSubuser")]
pub struct ApiServerSubuser {
    pub user: super::user::ApiUser,
    pub permissions: Vec<String>,

    pub created: NaiveDateTime,
}
