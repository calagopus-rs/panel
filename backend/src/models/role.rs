use super::BaseModel;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::{BTreeMap, HashSet},
    sync::LazyLock,
};
use utoipa::ToSchema;
use validator::ValidationError;

type Permission = (&'static str, IndexMap<&'static str, &'static str>);
pub static PERMISSIONS: LazyLock<IndexMap<&'static str, Permission>> = LazyLock::new(|| {
    IndexMap::from([
        (
            "control",
            (
                "Permissions that control a user's ability to control the power state of a server, or send commands.",
                IndexMap::from([
                    (
                        "console",
                        "Allows a user to send commands to the server instance via the console.",
                    ),
                    (
                        "start",
                        "Allows a user to start the server if it is stopped.",
                    ),
                    ("stop", "Allows a user to stop a server if it is running."),
                    (
                        "restart",
                        "Allows a user to perform a server restart. This allows them to start the server if it is offline, but not put the server in a completely stopped state.",
                    ),
                ]),
            ),
        ),
        (
            "subusers",
            (
                "Permissions that allow a user to manage other subusers on a server. They will never be able to edit their own account, or assign permissions they do not have themselves.",
                IndexMap::from([
                    (
                        "create",
                        "Allows a user to create new subusers for the server.",
                    ),
                    (
                        "read",
                        "Allows the user to view subusers and their permissions for the server.",
                    ),
                    ("update", "Allows a user to modify other subusers."),
                    (
                        "delete",
                        "Allows a user to delete a subuser from the server.",
                    ),
                ]),
            ),
        ),
        (
            "files",
            (
                "Permissions that control a user's ability to modify the filesystem for this server.",
                IndexMap::from([
                    (
                        "create",
                        "Allows a user to create additional files and folders via the Panel or direct upload.",
                    ),
                    (
                        "read",
                        "Allows a user to view the contents of a directory, but not view the contents of or download files.",
                    ),
                    (
                        "read-content",
                        "Allows a user to view the contents of a given file. This will also allow the user to download files.",
                    ),
                    (
                        "update",
                        "Allows a user to update the contents of an existing file or directory.",
                    ),
                    ("delete", "Allows a user to delete files or directories."),
                    (
                        "archive",
                        "Allows a user to archive the contents of a directory.",
                    ),
                ]),
            ),
        ),
        (
            "backups",
            (
                "Permissions that control a user's ability to manage server backups.",
                IndexMap::from([
                    (
                        "create",
                        "Allows a user to create a new backup for the server.",
                    ),
                    (
                        "read",
                        "Allows a user to view existing backups for the server.",
                    ),
                    (
                        "download",
                        "Allows a user to download a backup for the server.",
                    ),
                    (
                        "restore",
                        "Allows a user to restore a backup for the server.",
                    ),
                    (
                        "update",
                        "Allows a user to update an existing backup for the server.",
                    ),
                    ("delete", "Allows a user to delete a backup for the server."),
                ]),
            ),
        ),
        (
            "schedules",
            (
                "Permissions that control a user's ability to manage server schedules.",
                IndexMap::from([
                    (
                        "create",
                        "Allows a user to create a new schedule for the server.",
                    ),
                    (
                        "read",
                        "Allows a user to view existing schedules for the server.",
                    ),
                    (
                        "update",
                        "Allows a user to update an existing schedule for the server.",
                    ),
                    (
                        "delete",
                        "Allows a user to delete a schedule for the server.",
                    ),
                ]),
            ),
        ),
        (
            "allocations",
            (
                "Permissions that control a user's ability to modify the port allocations for this server.",
                IndexMap::from([
                    (
                        "read",
                        "Allows a user to view all allocations currently assigned to this server. Users with any level of access to this server can always view the primary allocation.",
                    ),
                    (
                        "create",
                        "Allows a user to assign additional allocations to the server.",
                    ),
                    (
                        "update",
                        "Allows a user to change the primary server allocation and attach notes to each allocation.",
                    ),
                    (
                        "delete",
                        "Allows a user to delete an allocation from the server.",
                    ),
                ]),
            ),
        ),
        (
            "startup",
            (
                "Permissions that control a user's ability to view this server's startup parameters.",
                IndexMap::from([
                    (
                        "read",
                        "Allows a user to view the startup variables for a server.",
                    ),
                    (
                        "update",
                        "Allows a user to modify the startup variables for the server.",
                    ),
                    (
                        "command",
                        "Allows a user to modify the command used to start the server.",
                    ),
                    (
                        "docker-image",
                        "Allows a user to modify the Docker image used when running the server.",
                    ),
                ]),
            ),
        ),
        (
            "databases",
            (
                "Permissions that control a user's access to the database management for this server.",
                IndexMap::from([
                    (
                        "create",
                        "Allows a user to create a new database for this server.",
                    ),
                    (
                        "read",
                        "Allows a user to view the database associated with this server.",
                    ),
                    (
                        "read-password",
                        "Allows a user to view the password associated with a database instance for this server.",
                    ),
                    (
                        "update",
                        "Allows a user to rotate the password on a database instance. If the user does not have the view_password permission they will not see the updated password.",
                    ),
                    (
                        "delete",
                        "Allows a user to remove a database instance from this server.",
                    ),
                ]),
            ),
        ),
        (
            "settings",
            (
                "Permissions that control a user's access to the settings for this server.",
                IndexMap::from([
                    (
                        "rename",
                        "Allows a user to rename this server and change the description of it.",
                    ),
                    (
                        "timezone",
                        "Allows a user to change the timezone for this server.",
                    ),
                    (
                        "auto-kill",
                        "Allows a user to change the auto-kill settings for this server.",
                    ),
                    (
                        "reinstall",
                        "Allows a user to trigger a reinstall of this server.",
                    ),
                ]),
            ),
        ),
        (
            "activity",
            (
                "Permissions that control a user's access to the server activity logs.",
                IndexMap::from([(
                    "read",
                    "Allows a user to view the activity logs for the server.",
                )]),
            ),
        ),
    ])
});

pub static PERMISSIONS_LIST: LazyLock<HashSet<String>> = LazyLock::new(|| {
    PERMISSIONS
        .iter()
        .flat_map(|(key, (_, permissions))| {
            permissions
                .keys()
                .map(|permission| format!("{key}.{permission}"))
                .collect::<HashSet<_>>()
        })
        .collect()
});

#[inline]
pub fn validate_permissions(permissions: &[String]) -> Result<(), ValidationError> {
    for permission in permissions {
        if !PERMISSIONS_LIST.contains(permission) {
            return Err(ValidationError::new("permissions")
                .with_message(format!("invalid permission: {permission}").into()));
        }
    }

    Ok(())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Role {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub permissions: Vec<String>,

    pub users: i64,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for Role {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("roles");

        BTreeMap::from([
            (format!("{table}.uuid"), format!("{prefix}uuid")),
            (format!("{table}.name"), format!("{prefix}name")),
            (
                format!("{table}.description"),
                format!("{prefix}description"),
            ),
            (
                format!("{table}.permissions"),
                format!("{prefix}permissions"),
            ),
            (
                format!("(SELECT COUNT(*) FROM users WHERE users.role_uuid = {table}.uuid)"),
                format!("{prefix}users"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            uuid: row.get(format!("{prefix}uuid").as_str()),
            name: row.get(format!("{prefix}name").as_str()),
            description: row.get(format!("{prefix}description").as_str()),
            permissions: row.get(format!("{prefix}permissions").as_str()),
            users: row.get(format!("{prefix}users").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl Role {
    pub async fn create(
        database: &crate::database::Database,
        name: &str,
        description: Option<&str>,
        permissions: &[String],
    ) -> Result<Self, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            INSERT INTO roles (name, description, permissions)
            VALUES ($1, $2, $3)
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(name)
        .bind(description)
        .bind(permissions)
        .fetch_one(database.write())
        .await?;

        Ok(Self::map(None, &row))
    }

    pub async fn by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM roles
            WHERE roles.uuid = $1
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(uuid)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn all_with_pagination(
        database: &crate::database::Database,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM roles
            WHERE ($1 IS NULL OR roles.name ILIKE '%' || $1 || '%')
            ORDER BY roles.created
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None)
        ))
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

    pub async fn delete_by_uuid(
        database: &crate::database::Database,
        uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM roles
            WHERE roles.uuid = $1
            "#,
        )
        .bind(uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiRole {
        AdminApiRole {
            uuid: self.uuid,
            name: self.name,
            description: self.description,
            permissions: self.permissions,
            users: self.users,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "Role")]
pub struct AdminApiRole {
    pub uuid: uuid::Uuid,

    pub name: String,
    pub description: Option<String>,

    pub permissions: Vec<String>,

    pub users: i64,

    pub created: chrono::DateTime<chrono::Utc>,
}
