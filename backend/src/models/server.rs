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

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Server {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("servers");

        let mut columns = BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.uuid", table),
                format!("{}uuid", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.uuid_short", table),
                format!("{}uuid_short", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.external_id", table),
                format!("{}external_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.allocation_id", table),
                format!("{}allocation_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.node_id", table),
                format!("{}node_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.owner_id", table),
                format!("{}owner_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.egg_id", table),
                format!("{}egg_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.status", table),
                format!("{}status", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.suspended", table),
                format!("{}suspended", prefix.unwrap_or_default()),
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
                format!("{}.memory", table),
                format!("{}memory", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.swap", table),
                format!("{}swap", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.disk", table),
                format!("{}disk", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.io", table),
                format!("{}io", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.cpu", table),
                format!("{}cpu", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.pinned_cpus", table),
                format!("{}pinned_cpus", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.startup", table),
                format!("{}startup", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.image", table),
                format!("{}image", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.allocation_limit", table),
                format!("{}allocation_limit", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.database_limit", table),
                format!("{}database_limit", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.backup_limit", table),
                format!("{}backup_limit", prefix.unwrap_or_default()),
            ),
            (
                "server_subusers.permissions".to_string(),
                format!("{}permissions", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
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
            id: row.get(format!("{}id", prefix).as_str()),
            uuid: row.get(format!("{}uuid", prefix).as_str()),
            uuid_short: row.get(format!("{}uuid_short", prefix).as_str()),
            external_id: row.get(format!("{}external_id", prefix).as_str()),
            allocation: if row
                .try_get::<i32, _>(format!("{}allocation_id", prefix).as_str())
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
            status: row.get(format!("{}status", prefix).as_str()),
            suspended: row.get(format!("{}suspended", prefix).as_str()),
            name: row.get(format!("{}name", prefix).as_str()),
            description: row.get(format!("{}description", prefix).as_str()),
            memory: row.get(format!("{}memory", prefix).as_str()),
            swap: row.get(format!("{}swap", prefix).as_str()),
            disk: row.get(format!("{}disk", prefix).as_str()),
            io: row.get(format!("{}io", prefix).as_str()),
            cpu: row.get(format!("{}cpu", prefix).as_str()),
            pinned_cpus: row.get(format!("{}pinned_cpus", prefix).as_str()),
            startup: row.get(format!("{}startup", prefix).as_str()),
            image: row.get(format!("{}image", prefix).as_str()),
            allocation_limit: row.get(format!("{}allocation_limit", prefix).as_str()),
            database_limit: row.get(format!("{}database_limit", prefix).as_str()),
            backup_limit: row.get(format!("{}backup_limit", prefix).as_str()),
            subuser_permissions: row
                .try_get::<Vec<String>, _>(format!("{}permissions", prefix).as_str())
                .ok(),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl Server {
    pub async fn create(
        database: &crate::database::Database,
        node_id: i32,
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
        let mut attempts = 0;

        loop {
            let uuid = uuid::Uuid::new_v4();
            let uuid_short = uuid.as_fields().0 as i32;

            match sqlx::query(
                r#"
                INSERT INTO servers (
                    uuid,
                    uuid_short,
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
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18
                )
                RETURNING id, uuid
                "#,
            )
            .bind(uuid)
            .bind(uuid_short)
            .bind(node_id)
            .bind(owner_id)
            .bind(egg_id)
            .bind(name)
            .bind(description)
            .bind(memory)
            .bind(swap)
            .bind(disk)
            .bind(io)
            .bind(cpu)
            .bind(&pinned_cpus)
            .bind(startup)
            .bind(image)
            .bind(allocation_limit)
            .bind(database_limit)
            .bind(backup_limit)
            .fetch_one(database.write())
            .await
            {
                Ok(row) => return Ok((row.get("id"), row.get("uuid"))),
                Err(err) => {
                    if attempts >= 8 {
                        tracing::error!(
                            "failed to create server after 8 attempts, giving up: {:#?}",
                            err
                        );

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
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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

    pub async fn by_user_id_identifier(
        database: &crate::database::Database,
        user_id: i32,
        identifier: &str,
    ) -> Option<Self> {
        let query = format!(
            r#"
            SELECT {}, {}, {}, {}, {}, server_subusers.permissions
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
            WHERE servers.{} = $2 AND (servers.owner_id = $1 OR server_subusers.user_id = $1)
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

        let mut row = sqlx::query(&query).bind(user_id);
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
            SELECT DISTINCT ON (servers.id) {}, {}, {}, {}, {}, server_subusers.permissions, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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
            SELECT DISTINCT ON (servers.id) {}, {}, {}, {}, {}, server_subusers.permissions, COUNT(*) OVER() AS total_count
            FROM servers
            JOIN nodes ON nodes.id = servers.node_id
            JOIN locations ON locations.id = nodes.location_id
            LEFT JOIN server_allocations ON server_allocations.server_id = servers.id
            LEFT JOIN node_allocations ON node_allocations.node_id = server_allocations.allocation_id
            JOIN users ON users.id = servers.owner_id
            JOIN nest_eggs ON nest_eggs.id = servers.egg_id
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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
            LEFT JOIN server_subusers ON server_subusers.server_id = servers.id
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
    pub async fn into_remote_api_object(
        self,
        database: &crate::database::Database,
    ) -> RemoteApiServer {
        let (variables, backups, mounts, allocations) = tokio::try_join!(
            sqlx::query!(
                "SELECT nest_egg_variables.env_variable, server_variables.value
                FROM server_variables
                JOIN nest_egg_variables ON nest_egg_variables.id = server_variables.variable_id
                WHERE server_variables.server_id = $1",
                self.id
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
                    description: self.description.unwrap_or_else(|| "".to_string()),
                },
                suspended: self.suspended,
                invocation: self.startup,
                skip_egg_scripts: false,
                environment: variables
                    .into_iter()
                    .map(|v| (v.env_variable, serde_json::Value::String(v.value)))
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
    pub fn into_api_object(self) -> ApiServer {
        let allocation_id = self.allocation.as_ref().map(|a| a.id);

        ApiServer {
            id: self.id,
            uuid: self.uuid,
            uuid_short: format!("{:08x}", self.uuid_short),
            allocation: self.allocation.map(|a| a.into_api_object(allocation_id)),
            egg: self.egg.into_api_object(),
            is_owner: self.subuser_permissions.is_none(),
            permissions: self
                .subuser_permissions
                .unwrap_or_else(|| vec!["*".to_string()]),
            node_uuid: self.node.uuid,
            node_name: self.node.name,
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
