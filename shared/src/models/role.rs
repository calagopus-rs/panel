use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, sync::Arc};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Role {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub admin_permissions: Arc<Vec<String>>,
    pub server_permissions: Arc<Vec<String>>,

    pub users: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Role {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("roles.uuid", format!("{prefix}uuid")),
            ("roles.name", format!("{prefix}name")),
            ("roles.description", format!("{prefix}description")),
            (
                "roles.admin_permissions",
                format!("{prefix}admin_permissions"),
            ),
            (
                "roles.server_permissions",
                format!("{prefix}server_permissions"),
            ),
            (
                "(SELECT COUNT(*) FROM users WHERE users.role_uuid = roles.uuid)",
                format!("{prefix}users"),
            ),
            ("roles.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            admin_permissions: Arc::new(row.get(format!("{prefix}admin_permissions").as_str())),
            server_permissions: Arc::new(row.get(format!("{prefix}server_permissions").as_str())),
            users: row.get(format!("{prefix}users").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Role {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        admin_permissions: &[String],
        server_permissions: &[String],
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO roles (name, description, admin_permissions, server_permissions)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(name)
        .bind(description)
        .bind(admin_permissions)
        .bind(server_permissions)
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
            FROM roles
            WHERE roles.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
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
            FROM roles
            WHERE ($1 IS NULL OR roles.name ILIKE '%' || $1 || '%')
            ORDER BY roles.created
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
            DELETE FROM roles
            WHERE roles.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiRole {
        AdminApiRole {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            admin_permissions: self.admin_permissions,
            server_permissions: self.server_permissions,
            users: self.users,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Role")]
pub struct AdminApiRole {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub admin_permissions: Arc<Vec<String>>,
    pub server_permissions: Arc<Vec<String>>,

    pub users: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
