use crate::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;
use validator::Validate;

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExportedNestEggVariable {
    #[validate(length(min = 1, max = 255))]
    #[schema(min_length = 1, max_length = 255)]
    pub name: String,
    #[validate(length(max = 1024))]
    #[schema(max_length = 1024)]
    pub description: Option<String>,
    #[serde(default, alias = "sort")]
    pub order: i16,

    #[validate(length(min = 1, max = 255))]
    #[schema(min_length = 1, max_length = 255)]
    pub env_variable: String,
    #[validate(length(max = 1024))]
    #[schema(max_length = 1024)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_stringable_option"
    )]
    pub default_value: Option<String>,

    pub user_viewable: bool,
    pub user_editable: bool,
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_nest_egg_variable_rules"
    )]
    pub rules: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct NestEggVariable {
    pub uuid: uuid::Uuid,

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
    const NAME: &'static str = "nest_egg_variable";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("nest_egg_variables.uuid", format!("{prefix}uuid")),
            ("nest_egg_variables.name", format!("{prefix}name")),
            (
                "nest_egg_variables.description",
                format!("{prefix}description"),
            ),
            ("nest_egg_variables.order_", format!("{prefix}order")),
            (
                "nest_egg_variables.env_variable",
                format!("{prefix}env_variable"),
            ),
            (
                "nest_egg_variables.default_value",
                format!("{prefix}default_value"),
            ),
            (
                "nest_egg_variables.user_viewable",
                format!("{prefix}user_viewable"),
            ),
            (
                "nest_egg_variables.user_editable",
                format!("{prefix}user_editable"),
            ),
            ("nest_egg_variables.rules", format!("{prefix}rules")),
            ("nest_egg_variables.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(format!("{prefix}uuid").as_str())?,
            name: row.try_get(format!("{prefix}name").as_str())?,
            description: row.try_get(format!("{prefix}description").as_str())?,
            order: row.try_get(format!("{prefix}order").as_str())?,
            env_variable: row.try_get(format!("{prefix}env_variable").as_str())?,
            default_value: row.try_get(format!("{prefix}default_value").as_str())?,
            user_viewable: row.try_get(format!("{prefix}user_viewable").as_str())?,
            user_editable: row.try_get(format!("{prefix}user_editable").as_str())?,
            rules: row.try_get(format!("{prefix}rules").as_str())?,
            created: row.try_get(format!("{prefix}created").as_str())?,
        })
    }
}

impl NestEggVariable {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        name: &str,
        description: Option<&str>,
        order: i16,
        env_variable: &str,
        default_value: Option<&str>,
        user_viewable: bool,
        user_editable: bool,
        rules: &[String],
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nest_egg_variables (
                egg_uuid, name, description, order_, env_variable,
                default_value, user_viewable, user_editable, rules
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_uuid)
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

        Self::map(None, &row)
    }

    pub async fn by_egg_uuid_uuid(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_uuid = $1 AND nest_egg_variables.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn all_by_egg_uuid(
        database: &crate::database::Database,
        egg_uuid: uuid::Uuid,
    ) -> Result<Vec<Self>, crate::database::DatabaseError> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_uuid = $1
            ORDER BY nest_egg_variables.order_, nest_egg_variables.created
            "#,
            Self::columns_sql(None)
        ))
        .bind(egg_uuid)
        .fetch_all(database.read())
        .await?;

        rows.into_iter()
            .map(|row| Self::map(None, &row))
            .try_collect_vec()
    }

    #[inline]
    pub fn into_exported(self) -> ExportedNestEggVariable {
        ExportedNestEggVariable {
            name: self.name,
            description: self.description,
            order: self.order,
            env_variable: self.env_variable,
            default_value: self.default_value,
            user_viewable: self.user_viewable,
            user_editable: self.user_editable,
            rules: self.rules,
        }
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEggVariable {
        AdminApiNestEggVariable {
            uuid: self.uuid,
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

#[async_trait::async_trait]
impl DeletableModel for NestEggVariable {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<NestEggVariable>> =
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
            DELETE FROM nest_egg_variables
            WHERE nest_egg_variables.uuid = $1
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
#[schema(title = "NestEggVariable")]
pub struct AdminApiNestEggVariable {
    pub uuid: uuid::Uuid,

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
