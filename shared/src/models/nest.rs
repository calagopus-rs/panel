use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Clone)]
pub struct Nest {
    pub uuid: uuid::Uuid,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Nest {
    const NAME: &'static str = "nest";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("nests.uuid", format!("{prefix}uuid")),
            ("nests.author", format!("{prefix}author")),
            ("nests.name", format!("{prefix}name")),
            ("nests.description", format!("{prefix}description")),
            ("nests.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(format!("{prefix}uuid").as_str())?,
            author: row.try_get(format!("{prefix}author").as_str())?,
            name: row.try_get(format!("{prefix}name").as_str())?,
            description: row.try_get(format!("{prefix}description").as_str())?,
            created: row.try_get(format!("{prefix}created").as_str())?,
        })
    }
}

impl Nest {
    pub async fn create(
        database: &crate::database::Database,
        author: &str,
        name: &str,
        description: Option<&str>,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nests (author, name, description)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(author)
        .bind(name)
        .bind(description)
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
            FROM nests
            WHERE ($1 IS NULL OR nests.name ILIKE '%' || $1 || '%')
            ORDER BY nests.created
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

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query(
            r#"
            DELETE FROM nests
            WHERE nests.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNest {
        AdminApiNest {
            uuid: self.uuid,
            author: self.author,
            name: self.name,
            description: self.description,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for Nest {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nests
            WHERE nests.uuid = $1
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
#[schema(title = "Nest")]
pub struct AdminApiNest {
    pub uuid: uuid::Uuid,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
