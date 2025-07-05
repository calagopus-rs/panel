use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerVariable {
    pub variable: super::nest_egg_variable::NestEggVariable,

    pub value: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerVariable {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_variables");

        let mut columns = BTreeMap::from([
            (
                format!("{table}.variable_id"),
                format!("{prefix}variable_id"),
            ),
            (format!("{table}.value"), format!("{prefix}value")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::nest_egg_variable::NestEggVariable::columns(
            Some("variable_"),
            None,
        ));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            variable: super::nest_egg_variable::NestEggVariable::map(Some("variable_"), row),
            value: row.get(format!("{prefix}value").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerVariable {
    pub async fn new(
        database: &crate::database::Database,
        server_id: i32,
        variable_id: i32,
        value: &str,
    ) -> bool {
        sqlx::query(
            r#"
            INSERT INTO server_variables (server_id, variable_id, value)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(server_id)
        .bind(variable_id)
        .bind(value)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn all_by_server_id(
        database: &crate::database::Database,
        server_id: i32,
    ) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM server_variables
            JOIN nest_egg_variables ON nest_egg_variables.id = server_variables.variable_id
            WHERE server_variables.server_id = $1
            "#,
            Self::columns_sql(None, None),
            super::nest_egg_variable::NestEggVariable::columns_sql(Some("variable_"), None)
        ))
        .bind(server_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerVariable {
        ApiServerVariable {
            name: self.variable.name,
            description: self.variable.description,
            env_variable: self.variable.env_variable,
            default_value: self.variable.default_value,
            is_editable: self.variable.user_editable,
            rules: self.variable.rules,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerVariable")]
pub struct ApiServerVariable {
    pub name: String,
    pub description: Option<String>,

    pub env_variable: String,
    pub default_value: Option<String>,
    pub is_editable: bool,
    pub rules: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
