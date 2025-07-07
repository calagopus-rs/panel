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

        let variable = super::nest_egg_variable::NestEggVariable::map(Some("variable_"), row);
        let value = row
            .try_get(format!("{prefix}value").as_str())
            .unwrap_or_else(|_| {
                variable
                    .default_value
                    .clone()
                    .unwrap_or_else(|| "".to_string())
            });

        Self {
            variable,
            value,
            created: row
                .try_get(format!("{prefix}created").as_str())
                .unwrap_or_else(|_| chrono::Utc::now().naive_utc()),
        }
    }
}

impl ServerVariable {
    pub async fn create(
        database: &crate::database::Database,
        server_id: i32,
        variable_id: i32,
        value: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO server_variables (server_id, variable_id, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (server_id, variable_id) DO UPDATE SET value = EXCLUDED.value
            "#,
        )
        .bind(server_id)
        .bind(variable_id)
        .bind(value)
        .execute(database.write())
        .await?;

        Ok(())
    }

    pub async fn all_by_server_id_egg_id(
        database: &crate::database::Database,
        server_id: i32,
        egg_id: i32,
    ) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nest_egg_variables
            LEFT JOIN server_variables ON server_variables.variable_id = nest_egg_variables.id AND server_variables.server_id = $1
            WHERE nest_egg_variables.egg_id = $2
            ORDER BY nest_egg_variables.order_, nest_egg_variables.id
            "#,
            Self::columns_sql(None, None),
            super::nest_egg_variable::NestEggVariable::columns_sql(Some("variable_"), None)
        ))
        .bind(server_id)
        .bind(egg_id)
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
            value: self.value,
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
    pub value: String,
    pub is_editable: bool,
    pub rules: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
