use super::BaseModel;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
#[schema(rename_all = "lowercase")]
pub enum ServerConfigurationFileParser {
    File,
    Yaml,
    Properties,
    Ini,
    Json,
    Xml,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct ProcessConfigurationFileReplacement {
    pub r#match: String,
    pub if_value: Option<String>,
    pub replace_with: serde_json::Value,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct ProcessConfigurationFile {
    pub file: String,
    #[schema(inline)]
    pub parser: ServerConfigurationFileParser,
    #[schema(inline)]
    pub replace: Vec<ProcessConfigurationFileReplacement>,
}

#[derive(ToSchema, Serialize, Clone)]
pub struct ProcessConfiguration {
    #[schema(inline)]
    pub startup: crate::models::nest_egg::NestEggConfigStartup,
    #[schema(inline)]
    pub stop: crate::models::nest_egg::NestEggConfigStop,
    #[schema(inline)]
    pub configs: Vec<ProcessConfigurationFile>,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigStartup {
    pub done: Vec<String>,
    pub strip_ansi: bool,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigStop {
    pub r#type: String,
    pub value: Option<String>,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigScript {
    pub container: String,
    pub entrypoint: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NestEgg {
    pub id: i32,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    pub config_files: Vec<ProcessConfigurationFile>,
    pub config_startup: NestEggConfigStartup,
    pub config_stop: NestEggConfigStop,
    pub config_script: NestEggConfigScript,

    pub startup: String,
    pub force_outgoing_ip: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    pub file_denylist: Vec<String>,

    pub servers: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEgg {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("nest_eggs");

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
                format!("{}.config_files", table),
                format!("{}config_files", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.config_startup", table),
                format!("{}config_startup", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.config_stop", table),
                format!("{}config_stop", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.config_script", table),
                format!("{}config_script", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.startup", table),
                format!("{}startup", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.force_outgoing_ip", table),
                format!("{}force_outgoing_ip", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.features", table),
                format!("{}features", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.docker_images", table),
                format!("{}docker_images", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.file_denylist", table),
                format!("{}file_denylist", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
            (
                format!(
                    "(SELECT COUNT(*) FROM servers WHERE servers.egg_id = {}.id)",
                    table
                ),
                format!("{}servers", prefix.unwrap_or_default()),
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
            config_files: serde_json::from_value(
                row.get(format!("{}config_files", prefix).as_str()),
            )
            .unwrap(),
            config_startup: serde_json::from_value(
                row.get(format!("{}config_startup", prefix).as_str()),
            )
            .unwrap(),
            config_stop: serde_json::from_value(row.get(format!("{}config_stop", prefix).as_str()))
                .unwrap(),
            config_script: serde_json::from_value(
                row.get(format!("{}config_script", prefix).as_str()),
            )
            .unwrap(),
            startup: row.get(format!("{}startup", prefix).as_str()),
            force_outgoing_ip: row.get(format!("{}force_outgoing_ip", prefix).as_str()),
            features: row.get(format!("{}features", prefix).as_str()),
            docker_images: serde_json::from_value(
                row.get(format!("{}docker_images", prefix).as_str()),
            )
            .unwrap_or_default(),
            file_denylist: row.get(format!("{}file_denylist", prefix).as_str()),
            servers: row.get(format!("{}servers", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl NestEgg {
    pub async fn by_nest_id_with_pagination(
        database: &crate::database::Database,
        nest_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_eggs
            WHERE nest_eggs.nest_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(nest_id)
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

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_eggs
            WHERE nest_eggs.id = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM nest_eggs
            WHERE nest_eggs.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEgg {
        AdminApiNestEgg {
            id: self.id,
            author: self.author,
            name: self.name,
            description: self.description,
            config_files: self.config_files,
            config_startup: self.config_startup,
            config_stop: self.config_stop,
            config_script: self.config_script,
            startup: self.startup,
            force_outgoing_ip: self.force_outgoing_ip,
            features: self.features,
            docker_images: self.docker_images,
            file_denylist: self.file_denylist,
            created: self.created.and_utc(),
        }
    }

    #[inline]
    pub fn into_api_object(self) -> ApiNestEgg {
        ApiNestEgg {
            id: self.id,
            name: self.name,
            description: self.description,
            startup: self.startup,
            features: self.features,
            docker_images: self.docker_images,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminNestEgg")]
pub struct AdminApiNestEgg {
    pub id: i32,

    pub author: String,
    pub name: String,
    pub description: Option<String>,

    #[schema(inline)]
    pub config_files: Vec<ProcessConfigurationFile>,
    #[schema(inline)]
    pub config_startup: NestEggConfigStartup,
    #[schema(inline)]
    pub config_stop: NestEggConfigStop,
    #[schema(inline)]
    pub config_script: NestEggConfigScript,

    pub startup: String,
    pub force_outgoing_ip: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    pub file_denylist: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEgg")]
pub struct ApiNestEgg {
    pub id: i32,

    pub name: String,
    pub description: Option<String>,

    pub startup: String,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
