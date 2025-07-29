use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NestEggVariable {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,
    pub order: i16,

    pub env_variable: String,
    pub default_value: Option<String>,
    pub user_viewable: bool,
    pub user_editable: bool,
    pub rules: Vec<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEggVariable {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("nest_egg_variables");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (format!("{table}.order_"), format!("{prefix}order")),
            (
                format!("{table}.env_variable"),
                format!("{prefix}env_variable"),
            ),
            (
                format!("{table}.default_value"),
                format!("{prefix}default_value"),
            ),
            (
                format!("{table}.user_viewable"),
                format!("{prefix}user_viewable"),
            ),
            (
                format!("{table}.user_editable"),
                format!("{prefix}user_editable"),
            ),
            (format!("{table}.rules"), format!("{prefix}rules")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            order: row.get(format!("{prefix}order").as_str()),
            env_variable: row.get(format!("{prefix}env_variable").as_str()),
            default_value: row.get(format!("{prefix}default_value").as_str()),
            user_viewable: row.get(format!("{prefix}user_viewable").as_str()),
            user_editable: row.get(format!("{prefix}user_editable").as_str()),
            rules: row.get(format!("{prefix}rules").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl NestEggVariable {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        egg_id: i32,
        name: &str,
        description: Option<&str>,
        order: i16,
        env_variable: &str,
        default_value: Option<&str>,
        user_viewable: bool,
        user_editable: bool,
        rules: &[String],
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nest_egg_variables (
                egg_id, name, description, order_, env_variable,
                default_value, user_viewable, user_editable, rules
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_id)
        .bind(name)
        .bind(description)
        .bind(order)
        .bind(env_variable)
        .bind(default_value)
        .bind(user_viewable)
        .bind(user_editable)
        .bind(rules)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_egg_id_id(
        database: &crate::database::Database,
        egg_id: i32,
        id: i32,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_id = $1 AND nest_egg_variables.id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_id)
        .bind(id)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_by_egg_id(
        database: &crate::database::Database,
        egg_id: i32,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_id = $1
            ORDER BY nest_egg_variables.order_, nest_egg_variables.id
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_id)
        .fetch_all(database.read())
        .await?;

        Ok(rows.into_iter().map(|row| Self::map(None, &row)).collect())
    }

    pub async fn delete_by_id(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM nest_egg_variables
            WHERE nest_egg_variables.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEggVariable {
        AdminApiNestEggVariable {
            id: self.id,
            name: self.name,
            description: self.description,
            order: self.order,
            env_variable: self.env_variable,
            default_value: self.default_value,
            user_viewable: self.user_viewable,
            user_editable: self.user_editable,
            rules: self.rules,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEggVariable")]
pub struct AdminApiNestEggVariable {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,
    pub order: i16,

    pub env_variable: String,
    pub default_value: Option<String>,
    pub user_viewable: bool,
    pub user_editable: bool,
    pub rules: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
