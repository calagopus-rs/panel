use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, types::chrono::NaiveDateTime};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NestEggVariable {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub env_variable: String,
    pub default_value: Option<String>,
    pub user_viewable: bool,
    pub user_editable: bool,
    pub rules: Vec<String>,

    pub created: NaiveDateTime,
}

impl BaseModel for NestEggVariable {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("nest_egg_variables");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
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
                format!("{}.env_variable", table),
                format!("{}env_variable", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.default_value", table),
                format!("{}default_value", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.user_viewable", table),
                format!("{}user_viewable", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.user_editable", table),
                format!("{}user_editable", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.rules", table),
                format!("{}rules", prefix.unwrap_or_default()),
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
            name: row.get(format!("{}name", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            env_variable: row.get(format!("{}env_variable", prefix).as_str()),
            default_value: row.get(format!("{}default_value", prefix).as_str()),
            user_viewable: row.get(format!("{}user_viewable", prefix).as_str()),
            user_editable: row.get(format!("{}user_editable", prefix).as_str()),
            rules: row.get(format!("{}rules", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl NestEggVariable {
    pub async fn new(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        env_variable: &str,
        default_value: Option<&str>,
        user_viewable: bool,
        user_editable: bool,
        rules: &[String],
    ) -> bool {
        sqlx::query(&format!(
            r#"
            INSERT INTO nest_egg_variables (name, description, env_variable, default_value, user_viewable, user_editable, rules)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(name)
        .bind(description)
        .bind(env_variable)
        .bind(default_value)
        .bind(user_viewable)
        .bind(user_editable)
        .bind(rules)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn save(&self, database: &crate::database::Database) {
        sqlx::query(
            r#"
            UPDATE nest_egg_variables
            SET
                name = $2,
                description = $3,
                env_variable = $4,
                default_value = $5,
                user_viewable = $6,
                user_editable = $7,
                rules = $8
            WHERE nest_egg_variables.id = $1
            "#,
        )
        .bind(self.id)
        .bind(&self.name)
        .bind(&self.description)
        .bind(&self.env_variable)
        .bind(&self.default_value)
        .bind(self.user_viewable)
        .bind(self.user_editable)
        .bind(&self.rules)
        .execute(database.write())
        .await
        .unwrap();
    }

    pub async fn all_by_egg_id(database: &crate::database::Database, egg_id: i32) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(egg_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM nest_egg_variables
            WHERE nest_egg_variables.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEggVariable {
        AdminApiNestEggVariable {
            id: self.id,
            name: self.name,
            description: self.description,
            env_variable: self.env_variable,
            default_value: self.default_value,
            user_viewable: self.user_viewable,
            user_editable: self.user_editable,
            rules: self.rules,
            created: self.created,
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEggVariable")]
pub struct AdminApiNestEggVariable {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub env_variable: String,
    pub default_value: Option<String>,
    pub user_viewable: bool,
    pub user_editable: bool,
    pub rules: Vec<String>,

    pub created: NaiveDateTime,
}
