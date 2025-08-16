use super::*;
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

    pub eggs: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Nest {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("nests");

        BTreeMap::from([
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.author"), format!("{prefix}author")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM nest_eggs WHERE nest_eggs.nest_uuid = {table}.uuid)"
                ),
                format!("{prefix}eggs"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            author: row.get(format!("{prefix}author").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            eggs: row.get(format!("{prefix}eggs").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Nest {
    pub async fn create(
        database: &crate::database::Database,
        author: &str,
        name: &str,
        description: Option<&str>,
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nests (author, name, description)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(author)
        .bind(name)
        .bind(description)
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
            FROM nests
            WHERE nests.uuid = $1
            "#,
            Self::columns_sql(None, None)
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
            FROM nests
            WHERE ($1 IS NULL OR nests.name ILIKE '%' || $1 || '%')
            ORDER BY nests.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
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
            eggs: self.eggs,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Nest")]
pub struct AdminApiNest {
    pub uuid: uuid::Uuid,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub eggs: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
