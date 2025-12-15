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

fn true_fn() -> bool {
    true
}

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
    pub r#match: compact_str::CompactString,
    #[serde(default)]
    pub insert_new: bool,
    #[serde(default = "true_fn")]
    pub update_existing: bool,
    pub if_value: Option<compact_str::CompactString>,
    pub replace_with: serde_json::Value,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct ProcessConfigurationFile {
    pub file: compact_str::CompactString,
    #[serde(default = "true_fn")]
    pub create_new: bool,
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
    pub done: Vec<compact_str::CompactString>,
    #[serde(default)]
    pub strip_ansi: bool,
}

#[derive(ToSchema, Serialize, Deserialize, Clone, Default)]
pub struct NestEggConfigStop {
    pub r#type: compact_str::CompactString,
    pub value: Option<compact_str::CompactString>,
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
pub struct NestEggConfigScript {
    pub container: compact_str::CompactString,
    pub entrypoint: compact_str::CompactString,
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
    #[serde(default = "true_fn")]
    pub create_new: bool,
    #[schema(inline)]
    pub parser: ServerConfigurationFileParser,
    #[schema(inline)]
    pub replace: Vec<ProcessConfigurationFileReplacement>,
}

#[derive(ToSchema, Validate, Serialize, Deserialize, Clone)]
pub struct ExportedNestEggConfigs {
    #[schema(inline)]
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_nest_egg_config_files"
    )]
    pub files: IndexMap<compact_str::CompactString, ExportedNestEggConfigsFilesFile>,
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

#[derive(ToSchema, Validate, Serialize, Deserialize, Clone)]
pub struct ExportedNestEggScripts {
    #[schema(inline)]
    pub installation: NestEggConfigScript,
}

#[derive(ToSchema, Validate, Serialize, Deserialize, Clone)]
pub struct ExportedNestEgg {
    #[serde(default = "uuid::Uuid::new_v4")]
    pub uuid: uuid::Uuid,
    #[validate(length(min = 3, max = 255))]
    #[schema(min_length = 3, max_length = 255)]
    pub name: compact_str::CompactString,
    #[validate(length(max = 1024))]
    #[schema(max_length = 1024)]
    #[serde(deserialize_with = "crate::deserialize::deserialize_string_option")]
    pub description: Option<compact_str::CompactString>,
    #[validate(length(min = 2, max = 255))]
    #[schema(min_length = 2, max_length = 255)]
    pub author: compact_str::CompactString,

    #[schema(inline)]
    pub config: ExportedNestEggConfigs,
    #[schema(inline)]
    pub scripts: ExportedNestEggScripts,

    #[validate(length(min = 1, max = 8192))]
    #[schema(min_length = 1, max_length = 8192)]
    pub startup: compact_str::CompactString,
    #[serde(default)]
    pub force_outgoing_ip: bool,
    #[serde(default)]
    pub separate_port: bool,

    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_defaultable"
    )]
    pub features: Vec<compact_str::CompactString>,
    pub docker_images: IndexMap<compact_str::CompactString, compact_str::CompactString>,
    #[serde(
        default,
        deserialize_with = "crate::deserialize::deserialize_defaultable"
    )]
    pub file_denylist: Vec<compact_str::CompactString>,

    #[schema(inline)]
    pub variables: Vec<super::nest_egg_variable::ExportedNestEggVariable>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NestEgg {
    pub uuid: uuid::Uuid,
    pub nest: Fetchable<super::nest::Nest>,
    pub egg_repository_egg: Option<Fetchable<super::egg_repository_egg::EggRepositoryEgg>>,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub author: compact_str::CompactString,

    pub config_files: Vec<ProcessConfigurationFile>,
    pub config_startup: NestEggConfigStartup,
    pub config_stop: NestEggConfigStop,
    pub config_script: NestEggConfigScript,
    pub config_allocations: NestEggConfigAllocations,

    pub startup: compact_str::CompactString,
    pub force_outgoing_ip: bool,
    pub separate_port: bool,

    pub features: Vec<compact_str::CompactString>,
    pub docker_images: IndexMap<compact_str::CompactString, compact_str::CompactString>,
    pub file_denylist: Vec<compact_str::CompactString>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEgg {
    const NAME: &'static str = "nest_egg";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        BTreeMap::from([
            (
                "nest_eggs.uuid",
                compact_str::format_compact!("{prefix}uuid"),
            ),
            (
                "nest_eggs.nest_uuid",
                compact_str::format_compact!("{prefix}nest_uuid"),
            ),
            (
                "nest_eggs.egg_repository_egg_uuid",
                compact_str::format_compact!("{prefix}egg_repository_egg_uuid"),
            ),
            (
                "nest_eggs.name",
                compact_str::format_compact!("{prefix}name"),
            ),
            (
                "nest_eggs.description",
                compact_str::format_compact!("{prefix}description"),
            ),
            (
                "nest_eggs.author",
                compact_str::format_compact!("{prefix}author"),
            ),
            (
                "nest_eggs.config_files",
                compact_str::format_compact!("{prefix}config_files"),
            ),
            (
                "nest_eggs.config_startup",
                compact_str::format_compact!("{prefix}config_startup"),
            ),
            (
                "nest_eggs.config_stop",
                compact_str::format_compact!("{prefix}config_stop"),
            ),
            (
                "nest_eggs.config_script",
                compact_str::format_compact!("{prefix}config_script"),
            ),
            (
                "nest_eggs.config_allocations",
                compact_str::format_compact!("{prefix}config_allocations"),
            ),
            (
                "nest_eggs.startup",
                compact_str::format_compact!("{prefix}startup"),
            ),
            (
                "nest_eggs.force_outgoing_ip",
                compact_str::format_compact!("{prefix}force_outgoing_ip"),
            ),
            (
                "nest_eggs.separate_port",
                compact_str::format_compact!("{prefix}separate_port"),
            ),
            (
                "nest_eggs.features",
                compact_str::format_compact!("{prefix}features"),
            ),
            (
                "nest_eggs.docker_images",
                compact_str::format_compact!("{prefix}docker_images"),
            ),
            (
                "nest_eggs.file_denylist",
                compact_str::format_compact!("{prefix}file_denylist"),
            ),
            (
                "nest_eggs.created",
                compact_str::format_compact!("{prefix}created"),
            ),
            (
                "nest_eggs.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            uuid: row.try_get(compact_str::format_compact!("{prefix}uuid").as_str())?,
            nest: super::nest::Nest::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}nest_uuid").as_str())?,
            ),
            egg_repository_egg: row
                .try_get::<Option<uuid::Uuid>, _>(
                    compact_str::format_compact!("{prefix}egg_repository_egg_uuid").as_str(),
                )?
                .map(super::egg_repository_egg::EggRepositoryEgg::get_fetchable),
            name: row.try_get(compact_str::format_compact!("{prefix}name").as_str())?,
            description: row
                .try_get(compact_str::format_compact!("{prefix}description").as_str())?,
            author: row.try_get(compact_str::format_compact!("{prefix}author").as_str())?,
            config_files: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}config_files").as_str())?,
            )?,
            config_startup: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}config_startup").as_str())?,
            )?,
            config_stop: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}config_stop").as_str())?,
            )?,
            config_script: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}config_script").as_str())?,
            )?,
            config_allocations: serde_json::from_value(
                row.try_get(compact_str::format_compact!("{prefix}config_allocations").as_str())?,
            )?,
            startup: row.try_get(compact_str::format_compact!("{prefix}startup").as_str())?,
            force_outgoing_ip: row
                .try_get(compact_str::format_compact!("{prefix}force_outgoing_ip").as_str())?,
            separate_port: row
                .try_get(compact_str::format_compact!("{prefix}separate_port").as_str())?,
            features: row.try_get(compact_str::format_compact!("{prefix}features").as_str())?,
            docker_images: serde_json::from_str(row.try_get::<&str, _>(
                compact_str::format_compact!("{prefix}docker_images").as_str(),
            )?)
            .unwrap_or_default(),
            file_denylist: row
                .try_get(compact_str::format_compact!("{prefix}file_denylist").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl NestEgg {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
        egg_repository_egg_uuid: Option<uuid::Uuid>,
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
        features: &[compact_str::CompactString],
        docker_images: IndexMap<compact_str::CompactString, compact_str::CompactString>,
        file_denylist: &[compact_str::CompactString],
    ) -> Result<Self, crate::database::DatabaseError> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO nest_eggs (
                nest_uuid, egg_repository_egg_uuid, author, name, description, config_files, config_startup,
                config_stop, config_script, config_allocations, startup, force_outgoing_ip,
                separate_port, features, docker_images, file_denylist
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING {}
            "#,
            Self::columns_sql(None)
        ))
        .bind(nest_uuid)
        .bind(egg_repository_egg_uuid)
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
        .bind(serde_json::to_string(&docker_images)?)
        .bind(file_denylist)
        .fetch_one(database.write())
        .await?;

        Self::map(None, &row)
    }

    pub async fn import(
        database: &crate::database::Database,
        nest_uuid: uuid::Uuid,
        egg_repository_egg_uuid: Option<uuid::Uuid>,
        exported_egg: ExportedNestEgg,
    ) -> Result<Self, crate::database::DatabaseError> {
        let egg = Self::create(
            database,
            nest_uuid,
            egg_repository_egg_uuid,
            &exported_egg.author,
            &exported_egg.name,
            exported_egg.description.as_deref(),
            exported_egg
                .config
                .files
                .into_iter()
                .map(|(file, config)| ProcessConfigurationFile {
                    file,
                    create_new: config.create_new,
                    parser: config.parser,
                    replace: config.replace,
                })
                .collect(),
            exported_egg.config.startup,
            exported_egg.config.stop,
            exported_egg.scripts.installation,
            exported_egg.config.allocations,
            &exported_egg.startup,
            exported_egg.force_outgoing_ip,
            exported_egg.separate_port,
            &exported_egg.features,
            exported_egg.docker_images,
            &exported_egg.file_denylist,
        )
        .await?;

        for variable in exported_egg.variables {
            if rule_validator::validate_rules(&variable.rules).is_err() {
                continue;
            }

            if let Err(err) = super::nest_egg_variable::NestEggVariable::create(
                database,
                egg.uuid,
                &variable.name,
                variable.description.as_deref(),
                variable.order,
                &variable.env_variable,
                variable.default_value.as_deref(),
                variable.user_viewable,
                variable.user_editable,
                &variable.rules,
            )
            .await
            {
                tracing::warn!("error while importing nest egg variable: {:?}", err);
            }
        }

        Ok(egg)
    }

    pub async fn import_update(
        &self,
        database: &crate::database::Database,
        exported_egg: ExportedNestEgg,
    ) -> Result<(), crate::database::DatabaseError> {
        sqlx::query!(
            "UPDATE nest_eggs
            SET
                author = $2, name = $3, description = $4,
                config_files = $5, config_startup = $6, config_stop = $7,
                config_script = $8, config_allocations = $9, startup = $10,
                force_outgoing_ip = $11, separate_port = $12, features = $13,
                docker_images = $14, file_denylist = $15
            WHERE nest_eggs.uuid = $1",
            self.uuid,
            &exported_egg.author,
            &exported_egg.name,
            exported_egg.description.as_deref(),
            serde_json::to_value(
                &exported_egg
                    .config
                    .files
                    .into_iter()
                    .map(|(file, config)| ProcessConfigurationFile {
                        file,
                        create_new: config.create_new,
                        parser: config.parser,
                        replace: config.replace,
                    })
                    .collect::<Vec<_>>(),
            )?,
            serde_json::to_value(&exported_egg.config.startup)?,
            serde_json::to_value(&exported_egg.config.stop)?,
            serde_json::to_value(&exported_egg.scripts.installation)?,
            serde_json::to_value(&exported_egg.config.allocations)?,
            &exported_egg.startup,
            exported_egg.force_outgoing_ip,
            exported_egg.separate_port,
            &exported_egg
                .features
                .into_iter()
                .map(|f| f.into())
                .collect::<Vec<_>>(),
            serde_json::to_string(&exported_egg.docker_images)?,
            &exported_egg
                .file_denylist
                .into_iter()
                .map(|f| f.into())
                .collect::<Vec<_>>(),
        )
        .execute(database.write())
        .await?;

        let unused_variables = sqlx::query!(
            "SELECT nest_egg_variables.uuid
            FROM nest_egg_variables
            WHERE nest_egg_variables.egg_uuid = $1 AND nest_egg_variables.env_variable != ALL($2)",
            self.uuid,
            &exported_egg
                .variables
                .iter()
                .map(|v| v.env_variable.as_str())
                .collect::<Vec<_>>() as &[&str]
        )
        .fetch_all(database.read())
        .await?;

        for (i, variable) in exported_egg.variables.iter().enumerate() {
            if rule_validator::validate_rules(&variable.rules).is_err() {
                continue;
            }

            if let Err(err) = sqlx::query!(
                "INSERT INTO nest_egg_variables (  
                    egg_uuid, name, description, order_, env_variable,  
                    default_value, user_viewable, user_editable, rules  
                )  
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (egg_uuid, env_variable) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    order_ = EXCLUDED.order_,
                    default_value = EXCLUDED.default_value,
                    user_viewable = EXCLUDED.user_viewable,
                    user_editable = EXCLUDED.user_editable,
                    rules = EXCLUDED.rules",
                self.uuid,
                &variable.name,
                variable.description.as_deref(),
                if variable.order == 0 {
                    i as i16 + 1
                } else {
                    variable.order
                },
                &variable.env_variable,
                variable.default_value.as_deref(),
                variable.user_viewable,
                variable.user_editable,
                &variable
                    .rules
                    .iter()
                    .map(|r| r.as_str())
                    .collect::<Vec<_>>() as &[&str]
            )
            .execute(database.read())
            .await
            {
                tracing::warn!("error while importing nest egg variable: {:?}", err);
            }
        }

        let order_base = exported_egg.variables.len() as i16
            + exported_egg
                .variables
                .iter()
                .map(|v| v.order)
                .max()
                .unwrap_or_default();

        sqlx::query!(
            "UPDATE nest_egg_variables
            SET order_ = $1 + array_position($2, nest_egg_variables.uuid)
            WHERE nest_egg_variables.uuid = ANY($2) AND nest_egg_variables.egg_uuid = $3",
            order_base as i32,
            &unused_variables
                .into_iter()
                .map(|v| v.uuid)
                .collect::<Vec<_>>(),
            self.uuid,
        )
        .execute(database.write())
        .await?;

        Ok(())
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
                                create_new: file.create_new,
                                parser: file.parser,
                                replace: file.replace,
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
    pub async fn into_admin_api_object(
        self,
        database: &crate::database::Database,
    ) -> Result<AdminApiNestEgg, crate::database::DatabaseError> {
        Ok(AdminApiNestEgg {
            uuid: self.uuid,
            egg_repository_egg: match self.egg_repository_egg {
                Some(egg_repository_egg) => Some(
                    egg_repository_egg
                        .fetch_cached(database)
                        .await?
                        .into_admin_egg_api_object(database)
                        .await?,
                ),
                None => None,
            },
            name: self.name,
            description: self.description,
            author: self.author,
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
        })
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
    pub egg_repository_egg: Option<super::egg_repository_egg::AdminApiEggEggRepositoryEgg>,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,
    pub author: compact_str::CompactString,

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

    pub startup: compact_str::CompactString,
    pub force_outgoing_ip: bool,
    pub separate_port: bool,

    pub features: Vec<compact_str::CompactString>,
    pub docker_images: IndexMap<compact_str::CompactString, compact_str::CompactString>,
    pub file_denylist: Vec<compact_str::CompactString>,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEgg")]
pub struct ApiNestEgg {
    pub uuid: uuid::Uuid,

    pub name: compact_str::CompactString,
    pub description: Option<compact_str::CompactString>,

    pub startup: compact_str::CompactString,
    pub separate_port: bool,

    pub features: Vec<compact_str::CompactString>,
    pub docker_images: IndexMap<compact_str::CompactString, compact_str::CompactString>,

    pub created: chrono::DateTime<chrono::Utc>,
}
