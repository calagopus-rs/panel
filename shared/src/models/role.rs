use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Role {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub admin_permissions: Arc<Vec<compact_str::CompactString>>,
    pub server_permissions: Arc<Vec<compact_str::CompactString>>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Role {
    const NAME: &'static str = "role";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("roles.uuid", compact_str::format_compact!("{prefix}uuid")),
            ("roles.name", compact_str::format_compact!("{prefix}name")),
            (
                "roles.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "roles.admin_permissions",
                compact_str::format_compact!("{prefix}admin_permissions"),
            ),
            (
                "roles.server_permissions",
                compact_str::format_compact!("{prefix}server_permissions"),
            ),
            (
                "roles.created",
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
            admin_permissions: Arc::new(
                row.try_get(compact_str::format_compact!("{prefix}admin_permissions").as_str())?,
            ),
            server_permissions: Arc::new(
                row.try_get(compact_str::format_compact!("{prefix}server_permissions").as_str())?,
            ),
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl Role {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        admin_permissions: &[compact_str::CompactString],
        server_permissions: &[compact_str::CompactString],
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO roles (name, description, admin_permissions, server_permissions)
            VALUES ($1, $2, $3, $4)
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
    pub fn into_admin_api_object(self) -> AdminApiRole {
        AdminApiRole {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            admin_permissions: self.admin_permissions,
            server_permissions: self.server_permissions,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for Role {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM roles
            WHERE roles.uuid = $1
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
impl DeletableModel for Role {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<Role>> =
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
            DELETE FROM roles
            WHERE roles.uuid = $1
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
#[schema(title = "Role")]
pub struct AdminApiRole {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub admin_permissions: Arc<Vec<compact_str::CompactString>>,
    pub server_permissions: Arc<Vec<compact_str::CompactString>>,

    pub created: chrono::DateTime<chrono::Utc>,
}
