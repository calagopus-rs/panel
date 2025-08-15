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

#[derive(ToSchema, Serialize, Deserialize, Clone, Default)]
pub struct NestEggConfigStartup {
    pub done: Vec<String>,
    #[serde(default)]
    pub strip_ansi: bool,
}

#[derive(ToSchema, Serialize, Deserialize, Clone, Default)]
pub struct NestEggConfigStop {
    pub r#type: String,
    pub value: Option<String>,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigScript {
    pub container: String,
    pub entrypoint: String,
    #[serde(alias = "script")]
    pub content: String,
}

#[derive(ToSchema, Serialize, Deserialize, Clone, Copy)]
pub struct NestEggConfigAllocationsUserSelfAssign {
    pub enabled: bool,
    pub require_primary_allocation: bool,

    pub start_port: u16,
    pub end_port: u16,
}

impl Default for NestEggConfigAllocationsUserSelfAssign {
    fn default() -> Self {
        Self {
            enabled: false,
            require_primary_allocation: true,
            start_port: 49152,
            end_port: 65535,
        }
    }
}

impl NestEggConfigAllocationsUserSelfAssign {
    #[inline]
    pub fn is_valid(&self) -> bool {
        self.start_port < self.end_port && self.start_port >= 1024
    }
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigAllocations {
    #[schema(inline)]
    #[serde(default)]
    pub user_self_assign: NestEggConfigAllocationsUserSelfAssign,
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
    pub config_allocations: NestEggConfigAllocations,

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
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("nest_eggs");

        BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.author"), format!("{prefix}author")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (
                format!("{table}.config_files"),
                format!("{prefix}config_files"),
            ),
            (
                format!("{table}.config_startup"),
                format!("{prefix}config_startup"),
            ),
            (
                format!("{table}.config_stop"),
                format!("{prefix}config_stop"),
            ),
            (
                format!("{table}.config_script"),
                format!("{prefix}config_script"),
            ),
            (
                format!("{table}.config_allocations"),
                format!("{prefix}config_allocations"),
            ),
            (format!("{table}.startup"), format!("{prefix}startup")),
            (
                format!("{table}.force_outgoing_ip"),
                format!("{prefix}force_outgoing_ip"),
            ),
            (format!("{table}.features"), format!("{prefix}features")),
            (
                format!("{table}.docker_images"),
                format!("{prefix}docker_images"),
            ),
            (
                format!("{table}.file_denylist"),
                format!("{prefix}file_denylist"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
            (
                format!("(SELECT COUNT(*) FROM servers WHERE servers.egg_id = {table}.id)"),
                format!("{prefix}servers"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            author: row.get(format!("{prefix}author").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            config_files: serde_json::from_value(row.get(format!("{prefix}config_files").as_str()))
                .unwrap(),
            config_startup: serde_json::from_value(
                row.get(format!("{prefix}config_startup").as_str()),
            )
            .unwrap(),
            config_stop: serde_json::from_value(row.get(format!("{prefix}config_stop").as_str()))
                .unwrap(),
            config_script: serde_json::from_value(
                row.get(format!("{prefix}config_script").as_str()),
            )
            .unwrap(),
            config_allocations: serde_json::from_value(
                row.get(format!("{prefix}config_allocations").as_str()),
            )
            .unwrap(),
            startup: row.get(format!("{prefix}startup").as_str()),
            force_outgoing_ip: row.get(format!("{prefix}force_outgoing_ip").as_str()),
            features: row.get(format!("{prefix}features").as_str()),
            docker_images: serde_json::from_value(
                row.get(format!("{prefix}docker_images").as_str()),
            )
            .unwrap_or_default(),
            file_denylist: row.get(format!("{prefix}file_denylist").as_str()),
            servers: row.get(format!("{prefix}servers").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl NestEgg {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        nest_id: i32,
        author: &str,
        name: &str,
        description: Option<&str>,
        config_files: Vec<ProcessConfigurationFile>,
        config_startup: NestEggConfigStartup,
        config_stop: NestEggConfigStop,
        config_script: NestEggConfigScript,
        config_allocations: NestEggConfigAllocations,
        startup: &str,
        force_outgoing_ip: bool,
        features: &[String],
        docker_images: IndexMap<String, String>,
        file_denylist: &[String],
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nest_eggs (
                nest_id, author, name, description, config_files, config_startup,
                config_stop, config_script, config_allocations, startup,
                force_outgoing_ip, features, docker_images, file_denylist
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(nest_id)
        .bind(author)
        .bind(name)
        .bind(description)
        .bind(serde_json::to_value(config_files).unwrap())
        .bind(serde_json::to_value(config_startup).unwrap())
        .bind(serde_json::to_value(config_stop).unwrap())
        .bind(serde_json::to_value(config_script).unwrap())
        .bind(serde_json::to_value(config_allocations).unwrap())
        .bind(startup)
        .bind(force_outgoing_ip)
        .bind(features)
        .bind(serde_json::to_value(docker_images).unwrap())
        .bind(file_denylist)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_nest_id_with_pagination(
        database: &crate::database::Database,
        nest_id: i32,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_eggs
            WHERE nest_eggs.nest_id = $1 AND ($2 IS NULL OR nest_eggs.name ILIKE '%' || $2 || '%')
            ORDER BY nest_eggs.id ASC
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(nest_id)
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

    pub async fn by_id(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<Option<Self>, sqlx::Error> {
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
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_nest_id_id(
        database: &crate::database::Database,
        nest_id: i32,
        id: i32,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_eggs
            WHERE nest_eggs.nest_id = $1 AND nest_eggs.id = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(nest_id)
        .bind(id)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn delete_by_id(
        database: &crate::database::Database,
        id: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM nest_eggs
            WHERE nest_eggs.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await?;

        Ok(())
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
            config_allocations: self.config_allocations,
            startup: self.startup,
            force_outgoing_ip: self.force_outgoing_ip,
            features: self.features,
            docker_images: self.docker_images,
            file_denylist: self.file_denylist,
            servers: self.servers,
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
    #[schema(inline)]
    pub config_allocations: NestEggConfigAllocations,

    pub startup: String,
    pub force_outgoing_ip: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    pub file_denylist: Vec<String>,

    pub servers: i64,

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
