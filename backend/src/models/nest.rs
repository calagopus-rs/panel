use super::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct Nest {
    pub id: i32,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub eggs: i64,

    pub created: NaiveDateTime,
}

impl BaseModel for Nest {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("nests");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.author", table),
                format!("{}author", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.name", table),
                format!("{}name", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.description", table),
                format!("{}description", prefix.unwrap_or_default()),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM nest_eggs WHERE nest_eggs.nest_id = {}.id)",
                    table
                ),
                format!("{}eggs", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            author: row.get(format!("{}author", prefix).as_str()),
            name: row.get(format!("{}name", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            eggs: row.get(format!("{}eggs", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
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

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nests
            WHERE nests.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nests
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(per_page)
        .bind(offset)
        .fetch_all(database.read())
        .await
        .unwrap();

        super::Pagination {
            total: rows.first().map_or(0, |row| row.get("total_count")),
            per_page,
            page,
            data: rows.into_iter().map(|row| Self::map(None, &row)).collect(),
        }
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM nests
            WHERE nests.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNest {
        AdminApiNest {
            id: self.id,
            author: self.author,
            name: self.name,
            description: self.description,
            eggs: self.eggs,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Nest")]
pub struct AdminApiNest {
    pub id: i32,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub eggs: i64,

    pub created: NaiveDateTime,
}
