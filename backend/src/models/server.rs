use super::BaseModel;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow, prelude::Type};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Type, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "snake_case")]
#[schema(rename_all = "snake_case")]
#[sqlx(type_name = "server_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ServerStatus {
    Installing,
    InstallFailed,
    ReinstallFailed,
    RestoringBackup,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Server {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub uuid_short: i32,
    pub external_id: Option<String>,
    pub allocation: Option<super::server_allocation::ServerAllocation>,
    pub node: super::node::Node,
    pub owner: super::user::User,
    pub egg: super::nest_egg::NestEgg,

    pub status: Option<ServerStatus>,
    pub suspended: bool,

    pub name: String,
    pub description: Option<String>,

    pub memory: i64,
    pub swap: i64,
    pub disk: i64,
    pub io: i32,
    pub cpu: i32,
    pub pinned_cpus: Vec<i16>,

    pub startup: String,
    pub image: String,

    pub allocation_limit: i32,
    pub database_limit: i32,
    pub backup_limit: i32,

    pub subuser_permissions: Option<Vec<String>>,
    pub subuser_ignored_files: Option<Vec<String>>,
    #[serde(skip_serializing, skip_deserializing)]
    subuser_ignored_files_overrides: Option<ignore::overrides::Override>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Server {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("servers");

        let mut columns = BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.uuid_short"), format!("{prefix}uuid_short")),
            (
                format!("{table}.external_id"),
                format!("{prefix}external_id"),
            ),
            (
                format!("{table}.allocation_id"),
                format!("{prefix}allocation_id"),
            ),
            (format!("{table}.node_id"), format!("{prefix}node_id")),
            (format!("{table}.owner_id"), format!("{prefix}owner_id")),
            (format!("{table}.egg_id"), format!("{prefix}egg_id")),
            (format!("{table}.status"), format!("{prefix}status")),
            (format!("{table}.suspended"), format!("{prefix}suspended")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (format!("{table}.memory"), format!("{prefix}memory")),
            (format!("{table}.swap"), format!("{prefix}swap")),
            (format!("{table}.disk"), format!("{prefix}disk")),
            (format!("{table}.io"), format!("{prefix}io")),
            (format!("{table}.cpu"), format!("{prefix}cpu")),
            (
                format!("{table}.pinned_cpus"),
                format!("{prefix}pinned_cpus"),
            ),
            (format!("{table}.startup"), format!("{prefix}startup")),
            (format!("{table}.image"), format!("{prefix}image")),
            (
                format!("{table}.allocation_limit"),
                format!("{prefix}allocation_limit"),
            ),
            (
                format!("{table}.database_limit"),
                format!("{prefix}database_limit"),
            ),
            (
                format!("{table}.backup_limit"),
                format!("{prefix}backup_limit"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::server_allocation::ServerAllocation::columns(
            Some("allocation_"),
            None,
        ));
        columns.extend(super::node::Node::columns(Some("node_"), None));
        columns.extend(super::user::User::columns(Some("owner_"), None));
        columns.extend(super::nest_egg::NestEgg::columns(Some("egg_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            uuid: row.get(format!("{prefix}uuid").as_str()),
            uuid_short: row.get(format!("{prefix}uuid_short").as_str()),
            external_id: row.get(format!("{prefix}external_id").as_str()),
            allocation: if row
                .try_get::<i32, _>(format!("{prefix}allocation_id").as_str())
                .is_ok()
            {
                Some(super::server_allocation::ServerAllocation::map(
                    Some("allocation_"),
                    row,
                ))
            } else {
                None
            },
            node: super::node::Node::map(Some("node_"), row),
            owner: super::user::User::map(Some("owner_"), row),
            egg: super::nest_egg::NestEgg::map(Some("egg_"), row),
            status: row.get(format!("{prefix}status").as_str()),
            suspended: row.get(format!("{prefix}suspended").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            memory: row.get(format!("{prefix}memory").as_str()),
            swap: row.get(format!("{prefix}swap").as_str()),
            disk: row.get(format!("{prefix}disk").as_str()),
            io: row.get(format!("{prefix}io").as_str()),
            cpu: row.get(format!("{prefix}cpu").as_str()),
            pinned_cpus: row.get(format!("{prefix}pinned_cpus").as_str()),
            startup: row.get(format!("{prefix}startup").as_str()),
            image: row.get(format!("{prefix}image").as_str()),
            allocation_limit: row.get(format!("{prefix}allocation_limit").as_str()),
            database_limit: row.get(format!("{prefix}database_limit").as_str()),
            backup_limit: row.get(format!("{prefix}backup_limit").as_str()),
            subuser_permissions: row.try_get::<Vec<String>, _>("permissions").ok(),
            subuser_ignored_files: row.try_get::<Vec<String>, _>("ignored_files").ok(),
            subuser_ignored_files_overrides: None,
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Server {
    #[allow(clippy::too_many_arguments)]
    pub async fn create(
        database: &crate::database::Database,
        external_id: Option<String>,
        allocation_id: Option<i32>,
        allocation_ids: &[i32],
        start_on_completion: bool,
        node: &super::node::Node,
        owner_id: i32,
        egg_id: i32,
        name: &str,
        description: Option<&str>,
        memory: i64,
        swap: i64,
        disk: i64,
        io: i32,
        cpu: i32,
        pinned_cpus: &[i16],
        startup: &str,
        image: &str,
        allocation_limit: i32,
        database_limit: i32,
        backup_limit: i32,
    ) -> Result<(i32, uuid::Uuid), sqlx::Error> {
        let mut transaction = database.write().begin().await?;
        let mut attempts = 0;

        loop {
            let uuid = uuid::Uuid::new_v4();
            let uuid_short = uuid.as_fields().0 as i32;

            match sqlx::query(
                r#"
                INSERT INTO servers (
                    uuid,
                    uuid_short,
                    external_id,
                    allocation_id,
                    node_id,
                    owner_id,
                    egg_id,
                    name,
                    description,
                    memory,
                    swap,
                    disk,
                    io,
                    cpu,
                    pinned_cpus,
                    startup,
                    image,
                    allocation_limit,
                    database_limit,
                    backup_limit
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20
                )
                RETURNING id, uuid
                "#,
            )
            .bind(uuid)
            .bind(uuid_short)
            .bind(external_id.as_deref())
            .bind(allocation_id)
            .bind(node.id)
            .bind(owner_id)
            .bind(egg_id)
            .bind(name)
            .bind(description)
            .bind(memory)
            .bind(swap)
            .bind(disk)
            .bind(io)
            .bind(cpu)
            .bind(pinned_cpus)
            .bind(startup)
            .bind(image)
            .bind(allocation_limit)
            .bind(database_limit)
            .bind(backup_limit)
            .fetch_one(&mut *transaction)
            .await
            {
                Ok(row) => {
                    let id: i32 = row.get("id");

                    if let Some(allocation_id) = allocation_id {
                        sqlx::query(
                            r#"
                            INSERT INTO server_allocations (server_id, allocation_id)
                            VALUES ($1, $2)
                            "#,
                        )
                        .bind(id)
                        .bind(allocation_id)
                        .execute(&mut *transaction)
                        .await?;
                    }

                    for allocation_id in allocation_ids {
                        sqlx::query(
                            r#"
                            INSERT INTO server_allocations (server_id, allocation_id)
                            VALUES ($1, $2)
                            "#,
                        )
                        .bind(id)
                        .bind(allocation_id)
                        .execute(&mut *transaction)
                        .await?;
                    }

                    if let Err(err) = node
                        .api_client(database)
                        .post_servers(&wings_api::servers::post::RequestBody {
                            uuid,
                            start_on_completion,
                        })
                        .await
                    {
                        tracing::error!(server = %uuid, node = %node.uuid, "failed to create server: {:#?}", err);
                        transaction.rollback().await?;

                        return Err(sqlx::Error::Io(std::io::Error::other(err.1.error)));
                    }

                    transaction.commit().await?;

                    return Ok((id, row.get("uuid")));
                }
                Err(err) => {
                    if attempts >= 8 {
                        tracing::error!(
                            "failed to create server after 8 attempts, giving up: {:#?}",
                            err
                        );
                        transaction.rollback().await?;

                        return Err(err);
                    }
                    attempts += 1;

                    tracing::warn!(
                        "failed to create server, retrying with new uuid: {:#?}",
                        err
                    );

                    continue;
                }
            }
        }
    }

    pub async fn by_id(database: &crate::database::Database, id: i32) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}, {}, {}, {}
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            WHERE servers.id = $1
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        ))
        .bind(id)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_node_id_uuid(
        database: &crate::database::Database,
        node_id: i32,
        uuid: uuid::Uuid,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {}, {}, {}, {}
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            WHERE servers.node_id = $1 AND servers.uuid = $2
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        ))
        .bind(node_id)
        .bind(uuid)
        .fetch_optional(database.read())
        .await
        .unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_identifier(
        database: &crate::database::Database,
        identifier: &str,
    ) -> Option<Self> {
        let query = format!(
            r#"
            SELECT {}, {}, {}, {}, {}
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            WHERE servers.id = $1 OR servers.uuid = $2
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        );

        let mut row = sqlx::query(&query).bind(identifier.parse::<i32>().ok()?);
        row = match identifier.len() {
            8 => row.bind(u32::from_str_radix(identifier, 16).ok()? as i32),
            36 => row.bind(uuid::Uuid::parse_str(identifier).ok()?),
            _ => row.bind(identifier.parse::<i32>().ok()?),
        };
        let row = row.fetch_optional(database.read()).await.unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_user_identifier(
        database: &crate::database::Database,
        user: &super::user::User,
        identifier: &str,
    ) -> Option<Self> {
        let query = format!(
            r#"
            SELECT {}, {}, {}, {}, {}, server_subusers.permissions, server_subusers.ignored_files
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id AND server_subusers.user_id = $1
            WHERE servers.{} = $3 AND (servers.owner_id = $1 OR server_subusers.user_id = $1 OR $2)
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None),
            match identifier.len() {
                8 => "uuid_short",
                36 => "uuid",
                _ => "id",
            }
        );

        let mut row = sqlx::query(&query).bind(user.id).bind(user.admin);
        row = match identifier.len() {
            8 => row.bind(u32::from_str_radix(identifier, 16).ok()? as i32),
            36 => row.bind(uuid::Uuid::parse_str(identifier).ok()?),
            _ => row.bind(identifier.parse::<i32>().ok()?),
        };
        let row = row.fetch_optional(database.read()).await.unwrap();

        row.map(|row| Self::map(None, &row))
    }

    pub async fn by_user_id_with_pagination(
        database: &crate::database::Database,
        user_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT DISTINCT ON (servers.id) {}, {}, {}, {}, {}, server_subusers.permissions, server_subusers.ignored_files, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id AND server_subusers.user_id = $1
            WHERE servers.owner_id = $1 OR server_subusers.user_id = $1
            ORDER BY servers.id
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        ))
        .bind(user_id)
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

    pub async fn by_not_user_id_with_pagination(
        database: &crate::database::Database,
        user_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT DISTINCT ON (servers.id) {}, {}, {}, {}, {}, server_subusers.permissions, server_subusers.ignored_files, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id AND server_subusers.user_id = $1
            WHERE servers.owner_id != $1 AND server_subusers.user_id != $1
            ORDER BY servers.id
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        ))
        .bind(user_id)
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

    pub async fn by_node_id_with_pagination(
        database: &crate::database::Database,
        node_id: i32,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}, {}, {}, {}, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            WHERE servers.node_id = $1
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
        ))
        .bind(node_id)
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

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
    ) -> super::Pagination<Self> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}, {}, {}, {}, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LIMIT $1 OFFSET $2
            "#,
            Self::columns_sql(None, None),
            super::server_allocation::ServerAllocation::columns_sql(Some("allocation_"), None),
            super::node::Node::columns_sql(Some("node_"), None),
            super::user::User::columns_sql(Some("owner_"), None),
            super::nest_egg::NestEgg::columns_sql(Some("egg_"), None)
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
            DELETE FROM servers
            WHERE servers.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn has_permission(&self, permission: &str) -> Result<(), String> {
        if let Some(permissions) = &self.subuser_permissions {
            if permissions.iter().any(|p| p == permission) {
                Ok(())
            } else {
                Err(format!(
                    "you do not have permission to perform this action: {permission}"
                ))
            }
        } else {
            Ok(())
        }
    }

    #[inline]
    pub fn wings_permissions(&self, user: &super::user::User) -> Vec<&str> {
        let mut permissions = Vec::new();
        if user.admin {
            permissions.reserve_exact(5);
            permissions.push("websocket.connect");

            permissions.push("*");
            permissions.push("admin.websocket.errors");
            permissions.push("admin.websocket.install");
            permissions.push("admin.websocket.transfer");

            return permissions;
        }

        if let Some(subuser_permissions) = &self.subuser_permissions {
            permissions.reserve_exact(subuser_permissions.len() + 1);
            permissions.push("websocket.connect");

            for permission in subuser_permissions {
                permissions.push(permission.as_str());
            }
        } else {
            permissions.reserve_exact(2);
            permissions.push("websocket.connect");

            permissions.push("*");
        }

        permissions
    }

    #[inline]
    pub fn is_ignored(&mut self, path: &str, is_dir: bool) -> bool {
        if let Some(ignored_files) = &self.subuser_ignored_files {
            if let Some(overrides) = &mut self.subuser_ignored_files_overrides {
                return overrides.matched(path, is_dir).is_whitelist();
            }

            let mut override_builder = ignore::overrides::OverrideBuilder::new("/");

            for file in ignored_files {
                override_builder.add(file).ok();
            }

            override_builder
                .build()
                .is_ok_and(|overrides| overrides.matched(path, is_dir).is_whitelist())
        } else {
            false
        }
    }

    #[inline]
    pub async fn into_remote_api_object(
        self,
        database: &crate::database::Database,
    ) -> RemoteApiServer {
        let (variables, backups, mounts, allocations) = tokio::try_join!(
            sqlx::query!(
                "SELECT nest_egg_variables.env_variable, COALESCE(server_variables.value, nest_egg_variables.default_value) AS value
                FROM nest_egg_variables
                LEFT JOIN server_variables ON server_variables.variable_id = nest_egg_variables.id AND server_variables.server_id = $1
                WHERE nest_egg_variables.egg_id = $2",
                self.id,
                self.egg.id
            )
            .fetch_all(database.read()),
            sqlx::query!(
                "SELECT server_backups.uuid
                FROM server_backups
                WHERE server_backups.server_id = $1",
                self.id
            )
            .fetch_all(database.read()),
            sqlx::query!(
                "SELECT mounts.source, mounts.target, mounts.read_only
                FROM server_mounts
                JOIN mounts ON mounts.id = server_mounts.mount_id
                WHERE server_mounts.server_id = $1",
                self.id
            )
            .fetch_all(database.read()),
            sqlx::query!(
                "SELECT node_allocations.ip, node_allocations.port
                FROM server_allocations
                JOIN node_allocations ON node_allocations.id = server_allocations.allocation_id
                WHERE server_allocations.server_id = $1",
                self.id
            )
            .fetch_all(database.read()),
        )
        .unwrap();

        RemoteApiServer {
            settings: wings_api::ServerConfiguration {
                uuid: self.uuid,
                start_on_completion: None,
                meta: wings_api::ServerConfigurationMeta {
                    name: self.name,
                    description: self.description.unwrap_or_default(),
                },
                suspended: self.suspended,
                invocation: self.startup,
                skip_egg_scripts: false,
                environment: variables
                    .into_iter()
                    .map(|v| {
                        (
                            v.env_variable,
                            serde_json::Value::String(v.value.unwrap_or_default()),
                        )
                    })
                    .collect(),
                labels: IndexMap::new(),
                backups: backups.into_iter().map(|b| b.uuid).collect(),
                allocations: wings_api::ServerConfigurationAllocations {
                    force_outgoing_ip: self.egg.force_outgoing_ip,
                    default: self.allocation.map(|a| {
                        wings_api::ServerConfigurationServerConfigurationAllocationsDefault {
                            ip: a.allocation.ip.ip().to_string(),
                            port: a.allocation.port as u32,
                        }
                    }),
                    mappings: {
                        let mut mappings = IndexMap::new();
                        for allocation in allocations {
                            mappings
                                .entry(allocation.ip.ip().to_string())
                                .or_insert_with(Vec::new)
                                .push(allocation.port as u32);
                        }

                        mappings
                    },
                },
                build: wings_api::ServerConfigurationBuild {
                    memory_limit: self.memory,
                    swap: self.swap,
                    io_weight: self.io as u32,
                    cpu_limit: self.cpu as i64,
                    disk_space: self.disk as u64,
                    threads: {
                        let mut threads = String::new();
                        for cpu in &self.pinned_cpus {
                            if !threads.is_empty() {
                                threads.push(',');
                            }
                            threads.push_str(&cpu.to_string());
                        }

                        if threads.is_empty() {
                            None
                        } else {
                            Some(threads)
                        }
                    },
                    oom_disabled: true,
                },
                mounts: mounts
                    .into_iter()
                    .map(|m| wings_api::Mount {
                        source: m.source,
                        target: m.target,
                        read_only: m.read_only,
                    })
                    .collect(),
                egg: wings_api::ServerConfigurationEgg {
                    id: uuid::Uuid::from_fields(
                        self.egg.id as u32,
                        (self.egg.id >> 16) as u16,
                        self.egg.id as u16,
                        &[0; 8],
                    ),
                    file_denylist: self.egg.file_denylist,
                },
                container: wings_api::ServerConfigurationContainer { image: self.image },
            },
            process_configuration: super::nest_egg::ProcessConfiguration {
                startup: self.egg.config_startup,
                stop: self.egg.config_stop,
                configs: self.egg.config_files,
            },
        }
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiServer {
        let allocation_id = self.allocation.as_ref().map(|a| a.id);

        AdminApiServer {
            id: self.id,
            uuid: self.uuid,
            uuid_short: format!("{:08x}", self.uuid_short),
            external_id: self.external_id,
            allocation: self.allocation.map(|a| a.into_api_object(allocation_id)),
            node: self.node.into_admin_api_object(),
            owner: self.owner.into_api_object(true),
            egg: self.egg.into_admin_api_object(),
            status: self.status,
            suspended: self.suspended,
            name: self.name,
            description: self.description,
            limits: ApiServerLimits {
                cpu: self.cpu,
                memory: self.memory,
                swap: self.swap,
                disk: self.disk,
                io: self.io,
            },
            pinned_cpus: self.pinned_cpus,
            feature_limits: ApiServerFeatureLimits {
                allocations: self.allocation_limit,
                databases: self.database_limit,
                backups: self.backup_limit,
            },
            startup: self.startup,
            image: self.image,
            created: self.created.and_utc(),
        }
    }

    #[inline]
    pub fn into_api_object(self, user: &super::user::User) -> ApiServer {
        let allocation_id = self.allocation.as_ref().map(|a| a.id);

        ApiServer {
            id: self.id,
            uuid: self.uuid,
            uuid_short: format!("{:08x}", self.uuid_short),
            allocation: self.allocation.map(|a| a.into_api_object(allocation_id)),
            egg: self.egg.into_api_object(),
            is_owner: self.owner.id == user.id,
            permissions: if user.admin {
                vec!["*".to_string()]
            } else {
                self.subuser_permissions
                    .unwrap_or_else(|| vec!["*".to_string()])
            },
            node_uuid: self.node.uuid,
            node_name: self.node.name,
            node_maintenance_message: self.node.maintenance_message,
            sftp_host: self.node.sftp_host.unwrap_or_else(|| {
                self.node
                    .public_url
                    .unwrap_or(self.node.url)
                    .host_str()
                    .unwrap()
                    .to_string()
            }),
            sftp_port: self.node.sftp_port,
            status: self.status,
            suspended: self.suspended,
            name: self.name,
            description: self.description,
            limits: ApiServerLimits {
                cpu: self.cpu,
                memory: self.memory,
                swap: self.swap,
                disk: self.disk,
                io: self.io,
            },
            feature_limits: ApiServerFeatureLimits {
                allocations: self.allocation_limit,
                databases: self.database_limit,
                backups: self.backup_limit,
            },
            startup: self.startup,
            image: self.image,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "RemoteServer")]
pub struct RemoteApiServer {
    settings: wings_api::ServerConfiguration,
    process_configuration: super::nest_egg::ProcessConfiguration,
}

#[derive(ToSchema, Serialize)]
pub struct ApiServerLimits {
    pub cpu: i32,
    pub memory: i64,
    pub swap: i64,
    pub disk: i64,
    pub io: i32,
}

#[derive(ToSchema, Serialize)]
pub struct ApiServerFeatureLimits {
    pub allocations: i32,
    pub databases: i32,
    pub backups: i32,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminServer")]
pub struct AdminApiServer {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub uuid_short: String,
    pub external_id: Option<String>,
    pub allocation: Option<super::server_allocation::ApiServerAllocation>,
    pub node: super::node::AdminApiNode,
    pub owner: super::user::ApiUser,
    pub egg: super::nest_egg::AdminApiNestEgg,

    pub status: Option<ServerStatus>,
    pub suspended: bool,

    pub name: String,
    pub description: Option<String>,

    #[schema(inline)]
    pub limits: ApiServerLimits,
    pub pinned_cpus: Vec<i16>,
    #[schema(inline)]
    pub feature_limits: ApiServerFeatureLimits,

    pub startup: String,
    pub image: String,

    pub created: chrono::DateTime<chrono::Utc>,
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ApiServer")]
pub struct ApiServer {
    pub id: i32,
    pub uuid: uuid::Uuid,
    pub uuid_short: String,
    pub allocation: Option<super::server_allocation::ApiServerAllocation>,
    pub egg: super::nest_egg::ApiNestEgg,

    pub status: Option<ServerStatus>,
    pub suspended: bool,

    pub is_owner: bool,
    pub permissions: Vec<String>,

    pub node_uuid: uuid::Uuid,
    pub node_name: String,
    pub node_maintenance_message: Option<String>,

    pub sftp_host: String,
    pub sftp_port: i32,

    pub name: String,
    pub description: Option<String>,

    #[schema(inline)]
    pub limits: ApiServerLimits,
    #[schema(inline)]
    pub feature_limits: ApiServerFeatureLimits,

    pub startup: String,
    pub image: String,

    pub created: chrono::DateTime<chrono::Utc>,
}
