use crate::prelude::*;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;
use validator::Validate;

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
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_array_or_not"
    )]
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

#[derive(ToSchema, Serialize, Deserialize, Default, Clone)]
pub struct NestEggConfigAllocations {
    #[schema(inline)]
    #[serde(default)]
    pub user_self_assign: NestEggConfigAllocationsUserSelfAssign,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct ExportedNestEggConfigsFilesFile {
    #[schema(inline)]
    pub parser: ServerConfigurationFileParser,
    pub find: IndexMap<String, serde_json::Value>,
}

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExportedNestEggConfigs {
    #[schema(inline)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_pre_stringified"
    )]
    pub files: IndexMap<String, ExportedNestEggConfigsFilesFile>,
    #[schema(inline)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_pre_stringified"
    )]
    pub startup: NestEggConfigStartup,
    #[schema(inline)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_nest_egg_config_stop"
    )]
    pub stop: NestEggConfigStop,
    #[schema(inline)]
    #[serde(default)]
    pub allocations: NestEggConfigAllocations,
}

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExportedNestEggScripts {
    #[schema(inline)]
    pub installation: NestEggConfigScript,
}

#[derive(ToSchema, Validate, Serialize, Deserialize)]
pub struct ExportedNestEgg {
    #[serde(default = "uuid::Uuid::new_v4")]
    pub uuid: uuid::Uuid,
    #[validate(length(min = 2, max = 255))]
    #[schema(min_length = 2, max_length = 255)]
    pub author: String,
    #[validate(length(min = 3, max = 255))]
    #[schema(min_length = 3, max_length = 255)]
    pub name: String,
    #[validate(length(max = 1024))]
    #[schema(max_length = 1024)]
    pub description: Option<String>,

    #[schema(inline)]
    pub config: ExportedNestEggConfigs,
    #[schema(inline)]
    pub scripts: ExportedNestEggScripts,

    #[validate(length(min = 1, max = 8192))]
    #[schema(min_length = 1, max_length = 8192)]
    pub startup: String,
    #[serde(default)]
    pub force_outgoing_ip: bool,
    #[serde(default)]
    pub separate_port: bool,

    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_defaultable"
    )]
    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_defaultable"
    )]
    pub file_denylist: Vec<String>,

    #[schema(inline)]
    pub variables: Vec<super::nest_egg_variable::ExportedNestEggVariable>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NestEgg {
    pub uuid: uuid::Uuid,
    pub nest: Fetchable<super::nest::Nest>,

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
    pub separate_port: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    pub file_denylist: Vec<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEgg {
    const NAME: &'static str = "nest_egg";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            ("nest_eggs.uuid", format!("{prefix}uuid")),
            ("nest_eggs.nest_uuid", format!("{prefix}nest_uuid")),
            ("nest_eggs.author", format!("{prefix}author")),
            ("nest_eggs.name", format!("{prefix}name")),
            ("nest_eggs.description", format!("{prefix}description")),
            ("nest_eggs.config_files", format!("{prefix}config_files")),
            (
                "nest_eggs.config_startup",
                format!("{prefix}config_startup"),
            ),
            ("nest_eggs.config_stop", format!("{prefix}config_stop")),
            ("nest_eggs.config_script", format!("{prefix}config_script")),
            (
                "nest_eggs.config_allocations",
                format!("{prefix}config_allocations"),
            ),
            ("nest_eggs.startup", format!("{prefix}startup")),
            (
                "nest_eggs.force_outgoing_ip",
                format!("{prefix}force_outgoing_ip"),
            ),
            ("nest_eggs.separate_port", format!("{prefix}separate_port")),
            ("nest_eggs.features", format!("{prefix}features")),
            ("nest_eggs.docker_images", format!("{prefix}docker_images")),
            ("nest_eggs.file_denylist", format!("{prefix}file_denylist")),
            ("nest_eggs.created", format!("{prefix}created")),
            ("nest_eggs.created", format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(format!("{prefix}uuid").as_str())?,
            nest: super::nest::Nest::get_fetchable(
                row.try_get(format!("{prefix}nest_uuid").as_str())?,
            ),
            author: row.try_get(format!("{prefix}author").as_str())?,
            name: row.try_get(format!("{prefix}name").as_str())?,
            description: row.try_get(format!("{prefix}description").as_str())?,
            config_files: serde_json::from_value(
                row.try_get(format!("{prefix}config_files").as_str())?,
            )?,
            config_startup: serde_json::from_value(
                row.try_get(format!("{prefix}config_startup").as_str())?,
            )?,
            config_stop: serde_json::from_value(
                row.try_get(format!("{prefix}config_stop").as_str())?,
            )?,
            config_script: serde_json::from_value(
                row.try_get(format!("{prefix}config_script").as_str())?,
            )?,
            config_allocations: serde_json::from_value(
                row.try_get(format!("{prefix}config_allocations").as_str())?,
            )?,
            startup: row.try_get(format!("{prefix}startup").as_str())?,
            force_outgoing_ip: row.try_get(format!("{prefix}force_outgoing_ip").as_str())?,
            separate_port: row.try_get(format!("{prefix}separate_port").as_str())?,
            features: row.try_get(format!("{prefix}features").as_str())?,
            docker_images: serde_json::from_value(
                row.try_get(format!("{prefix}docker_images").as_str())?,
            )
            .unwrap_or_default(),
            file_denylist: row.try_get(format!("{prefix}file_denylist").as_str())?,
            created: row.try_get(format!("{prefix}created").as_str())?,
        })
    }
}

impl NestEgg {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
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
        separate_port: bool,
        features: &[String],
        docker_images: IndexMap<String, String>,
        file_denylist: &[String],
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nest_eggs (
                nest_uuid, author, name, description, config_files, config_startup,
                config_stop, config_script, config_allocations, startup, force_outgoing_ip,
                separate_port, features, docker_images, file_denylist
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(nest_uuid)
        .bind(author)
        .bind(name)
        .bind(description)
        .bind(serde_json::to_value(config_files)?)
        .bind(serde_json::to_value(config_startup)?)
        .bind(serde_json::to_value(config_stop)?)
        .bind(serde_json::to_value(config_script)?)
        .bind(serde_json::to_value(config_allocations)?)
        .bind(startup)
        .bind(force_outgoing_ip)
        .bind(separate_port)
        .bind(features)
        .bind(serde_json::to_value(docker_images)?)
        .bind(file_denylist)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn by_nest_uuid_with_pagination(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM nest_eggs
            WHERE nest_eggs.nest_uuid = $1 AND ($2 IS NULL OR nest_eggs.name ILIKE '%' || $2 || '%')
            ORDER BY nest_eggs.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
        ))
        .bind(nest_uuid)
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

    pub async fn by_nest_uuid_uuid(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_eggs
            WHERE nest_eggs.nest_uuid = $1 AND nest_eggs.uuid = $2
            "#,
            Self::columns_sql(None)
        ))
        .bind(nest_uuid)
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn count_by_nest_uuid(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
    ) -> i64 {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM nest_eggs
            WHERE nest_eggs.nest_uuid = $1
            "#,
        )
        .bind(nest_uuid)
        .fetch_one(database.read())
        .await
        .unwrap_or(0)
    }

    #[inline]
    pub async fn into_exported(
        self,
        database: &crate::database::Database,
    ) -> Result<ExportedNestEgg, crate::database::DatabaseError> {
        Ok(ExportedNestEgg {
            uuid: self.uuid,
            author: self.author,
            name: self.name,
            description: self.description,
            config: ExportedNestEggConfigs {
                files: self
                    .config_files
                    .into_iter()
                    .map(|file| {
                        (
                            file.file,
                            ExportedNestEggConfigsFilesFile {
                                parser: file.parser,
                                find: file
                                    .replace
                                    .into_iter()
                                    .map(|replace| (replace.r#match, replace.replace_with))
                                    .collect(),
                            },
                        )
                    })
                    .collect(),
                startup: self.config_startup,
                stop: self.config_stop,
                allocations: self.config_allocations,
            },
            scripts: ExportedNestEggScripts {
                installation: self.config_script,
            },
            startup: self.startup,
            force_outgoing_ip: self.force_outgoing_ip,
            separate_port: self.separate_port,
            features: self.features,
            docker_images: self.docker_images,
            file_denylist: self.file_denylist,
            variables: super::nest_egg_variable::NestEggVariable::all_by_egg_uuid(
                database, self.uuid,
            )
            .await?
            .into_iter()
            .map(|variable| variable.into_exported())
            .collect(),
        })
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEgg {
        AdminApiNestEgg {
            uuid: self.uuid,
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
            separate_port: self.separate_port,
            features: self.features,
            docker_images: self.docker_images,
            file_denylist: self.file_denylist,
            created: self.created.and_utc(),
        }
    }

    #[inline]
    pub fn into_api_object(self) -> ApiNestEgg {
        ApiNestEgg {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            startup: self.startup,
            separate_port: self.separate_port,
            features: self.features,
            docker_images: self.docker_images,
            created: self.created.and_utc(),
        }
    }
}

#[async_trait::async_trait]
impl ByUuid for NestEgg {
    async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM nest_eggs
            WHERE nest_eggs.uuid = $1
            "#,
            Self::columns_sql(None)
        ))
        .bind(uuid)
        .fetch_one(database.read())
        .await?;

        Self::map(None, &row)
    }
}

#[async_trait::async_trait]
impl DeletableModel for NestEgg {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<NestEgg>> =
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
            DELETE FROM nest_eggs
            WHERE nest_eggs.uuid = $1
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
#[schema(title = "AdminNestEgg")]
pub struct AdminApiNestEgg {
    pub uuid: uuid::Uuid,

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
    pub separate_port: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,
    pub file_denylist: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEgg")]
pub struct ApiNestEgg {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub startup: String,
    pub separate_port: bool,

    pub features: Vec<String>,
    pub docker_images: IndexMap<String, String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
