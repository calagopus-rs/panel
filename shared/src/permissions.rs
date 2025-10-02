use indexmap::IndexMap;
use serde::Serialize;
use std::{collections::HashSet, sync::LazyLock};
use utoipa::ToSchema;
use validator::ValidationError;

#[derive(ToSchema, Serialize)]
pub struct PermissionGroup {
    description: &'static str,
    permissions: IndexMap<&'static str, &'static str>,
}

#[derive(ToSchema, Serialize)]
pub struct PermissionMap {
    #[serde(skip)]
    list: HashSet<String>,
    #[serde(flatten)]
    map: IndexMap<&'static str, PermissionGroup>,
}

impl PermissionMap {
    pub fn new(map: IndexMap<&'static str, PermissionGroup>) -> Self {
        Self {
            list: map
                .iter()
                .flat_map(|(key, group)| {
                    group
                        .permissions
                        .keys()
                        .map(|permission| format!("{key}.{permission}"))
                        .collect::<HashSet<_>>()
                })
                .collect(),
            map,
        }
    }

    #[inline]
    pub fn list(&self) -> &HashSet<String> {
        &self.list
    }

    pub fn validate_permissions(&self, permissions: &[String]) -> Result<(), ValidationError> {
        for permission in permissions {
            if !self.list().contains(permission) {
                return Err(ValidationError::new("permissions")
                    .with_message(format!("invalid permission: {permission}").into()));
            }
        }

        Ok(())
    }
}

pub static USER_PERMISSIONS: LazyLock<PermissionMap> = LazyLock::new(|| {
    PermissionMap::new(IndexMap::from([
        (
            "account",
            PermissionGroup {
                description: "Permissions that control the ability to change account settings.",
                permissions: IndexMap::from([
                    (
                        "email",
                        "Allows to change the email address of the account.",
                    ),
                    ("password", "Allows to change the password of the account."),
                    (
                        "two-factor",
                        "Allows to add and remove two-factor authentication.",
                    ),
                    (
                        "avatar",
                        "Allows to update and remove the avatar of the account.",
                    ),
                ]),
            },
        ),
        (
            "api-keys",
            PermissionGroup {
                description: "Permissions that control the ability to manage api keys on an account. API Keys will never be able to edit themselves, or assign permissions they do not have themselves.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new keys for the account."),
                    (
                        "read",
                        "Allows to view keys and their permissions for the account.",
                    ),
                    ("update", "Allows to modify other keys."),
                    ("delete", "Allows to delete keys from the account."),
                ]),
            },
        ),
        (
            "security-keys",
            PermissionGroup {
                description: "Permissions that control the ability to manage security keys on an account.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create new security keys for the account.",
                    ),
                    ("read", "Allows to view security keys for the account."),
                    ("update", "Allows to modify other security keys."),
                    ("delete", "Allows to delete security keys from the account."),
                ]),
            },
        ),
        (
            "ssh-keys",
            PermissionGroup {
                description: "Permissions that control the ability to manage ssh keys on an account.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create or import new ssh keys for the account.",
                    ),
                    ("read", "Allows to view ssh keys for the account."),
                    ("update", "Allows to modify other ssh keys."),
                    ("delete", "Allows to delete ssh keys from the account."),
                ]),
            },
        ),
        (
            "sessions",
            PermissionGroup {
                description: "Permissions that control the ability to manage sessions on an account.",
                permissions: IndexMap::from([
                    (
                        "read",
                        "Allows to view sessions and their ip's for the account.",
                    ),
                    ("delete", "Allows to delete sessions from the account."),
                ]),
            },
        ),
        (
            "activity",
            PermissionGroup {
                description: "Permissions that control the ability to view the activity log on an account.",
                permissions: IndexMap::from([(
                    "read",
                    "Allows to view the activity logs for the account.",
                )]),
            },
        ),
    ]))
});

#[inline]
pub fn validate_user_permissions(permissions: &[String]) -> Result<(), ValidationError> {
    USER_PERMISSIONS.validate_permissions(permissions)
}

pub static ADMIN_PERMISSIONS: LazyLock<PermissionMap> = LazyLock::new(|| {
    PermissionMap::new(IndexMap::from([
        (
            "settings",
            PermissionGroup {
                description: "Permissions that control the ability to manage settings for the panel.",
                permissions: IndexMap::from([
                    (
                        "read",
                        "Allows to view settings and their passwords for the panel.",
                    ),
                    ("update", "Allows to modify settings and their passwords."),
                ]),
            },
        ),
        (
            "users",
            PermissionGroup {
                description: "Permissions that control the ability to manage users for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new users for the panel."),
                    ("read", "Allows to view users for the panel."),
                    ("update", "Allows to modify users."),
                    ("disable-two-factor", "Allows to remove users' two-factor."),
                    ("delete", "Allows to delete users from the panel."),
                ]),
            },
        ),
        (
            "roles",
            PermissionGroup {
                description: "Permissions that control the ability to manage roles for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new roles for the panel."),
                    ("read", "Allows to view roles for the panel."),
                    ("update", "Allows to modify roles."),
                    ("delete", "Allows to delete roles from the panel."),
                ]),
            },
        ),
        (
            "locations",
            PermissionGroup {
                description: "Permissions that control the ability to manage locations for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new locations for the panel."),
                    ("read", "Allows to view locations for the panel."),
                    ("update", "Allows to modify locations."),
                    ("delete", "Allows to delete locations from the panel."),
                    (
                        "database-hosts",
                        "Allows to view and manage a locations' database hosts.",
                    ),
                ]),
            },
        ),
        (
            "backup-configurations",
            PermissionGroup {
                description: "Permissions that control the ability to manage backup configurations for the panel.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create new backup configurations for the panel.",
                    ),
                    (
                        "read",
                        "Allows to view backup configurations and their passwords for the panel.",
                    ),
                    (
                        "update",
                        "Allows to modify backup configurations and their passwords.",
                    ),
                    (
                        "delete",
                        "Allows to delete backup configurations from the panel.",
                    ),
                ]),
            },
        ),
        (
            "nodes",
            PermissionGroup {
                description: "Permissions that control the ability to manage nodes for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new nodes for the panel."),
                    (
                        "read",
                        "Allows to view nodes and their token for the panel.",
                    ),
                    ("update", "Allows to modify nodes."),
                    ("delete", "Allows to delete nodes from the panel."),
                    ("reset-token", "Allows to reset a nodes' token."),
                    (
                        "allocations",
                        "Allows to view and manage a nodes' allocations.",
                    ),
                    ("mounts", "Allows to view and manage a nodes' mounts."),
                    (
                        "backups",
                        "Allows to view and manage a nodes' (detached) backups.",
                    ),
                ]),
            },
        ),
        (
            "servers",
            PermissionGroup {
                description: "Permissions that control the ability to manage servers for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new servers for the panel."),
                    ("read", "Allows to view servers for the panel."),
                    ("update", "Allows to modify servers."),
                    ("delete", "Allows to delete servers from the panel."),
                    ("transfer", "Allows to transfer servers to other nodes."),
                    (
                        "allocations",
                        "Allows to view and manage a servers' allocations.",
                    ),
                    (
                        "variables",
                        "Allows to view and manage a servers' variables.",
                    ),
                    ("mounts", "Allows to view and manage a servers' mounts."),
                ]),
            },
        ),
        (
            "nests",
            PermissionGroup {
                description: "Permissions that control the ability to manage nests for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new nests for the panel."),
                    ("read", "Allows to view nests for the panel."),
                    ("update", "Allows to modify nests."),
                    ("delete", "Allows to delete nests from the panel."),
                ]),
            },
        ),
        (
            "eggs",
            PermissionGroup {
                description: "Permissions that control the ability to manage eggs for the panel.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create and import new eggs for the panel.",
                    ),
                    ("read", "Allows to view eggs for the panel."),
                    ("update", "Allows to modify eggs."),
                    ("delete", "Allows to delete eggs from the panel."),
                    ("mounts", "Allows to view and manage an eggs' mounts."),
                ]),
            },
        ),
        (
            "database-hosts",
            PermissionGroup {
                description: "Permissions that control the ability to manage database hosts for the panel.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create new database hosts for the panel.",
                    ),
                    ("read", "Allows to view database hosts for the panel."),
                    ("update", "Allows to modify database hosts."),
                    ("delete", "Allows to delete database hosts from the panel."),
                    ("test", "Allows testing the database hosts' connection."),
                ]),
            },
        ),
        (
            "mounts",
            PermissionGroup {
                description: "Permissions that control the ability to manage mounts for the panel.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new mounts for the panel."),
                    ("read", "Allows to view mounts for the panel."),
                    ("update", "Allows to modify mounts."),
                    ("delete", "Allows to delete mounts from the panel."),
                ]),
            },
        ),
        (
            "activity",
            PermissionGroup {
                description: "Permissions that control the ability to view the activity log for all admin operations.",
                permissions: IndexMap::from([(
                    "read",
                    "Allows to view the activity logs for all admin operation.",
                )]),
            },
        ),
    ]))
});

#[inline]
pub fn validate_admin_permissions(permissions: &[String]) -> Result<(), ValidationError> {
    ADMIN_PERMISSIONS.validate_permissions(permissions)
}

pub static SERVER_PERMISSIONS: LazyLock<PermissionMap> = LazyLock::new(|| {
    PermissionMap::new(IndexMap::from([
        (
            "control",
            PermissionGroup {
                description: "Permissions that control the ability to control the power state of a server, or send commands.",
                permissions: IndexMap::from([
                    (
                        "console",
                        "Allows to send commands to the server instance via the console.",
                    ),
                    ("start", "Allows to start the server if it is stopped."),
                    ("stop", "Allows to stop a server if it is running."),
                    (
                        "restart",
                        "Allows to perform a server restart. This allows them to start the server if it is offline, but not put the server in a completely stopped state.",
                    ),
                ]),
            },
        ),
        (
            "subusers",
            PermissionGroup {
                description: "Permissions that control the ability to manage api keys of a server. Users will never be able to edit their own account, or assign permissions they do not have themselves.",
                permissions: IndexMap::from([
                    ("create", "Allows to create new subusers for the server."),
                    (
                        "read",
                        "Allows to view subusers and their permissions for the server.",
                    ),
                    ("update", "Allows to modify other subusers."),
                    ("delete", "Allows to delete a subuser from the server."),
                ]),
            },
        ),
        (
            "files",
            PermissionGroup {
                description: "Permissions that control the ability to modify the filesystem for this server.",
                permissions: IndexMap::from([
                    (
                        "create",
                        "Allows to create additional files and folders via the Panel or direct upload.",
                    ),
                    (
                        "read",
                        "Allows to view the contents of a directory, but not view the contents of or download files.",
                    ),
                    (
                        "read-content",
                        "Allows to view the contents of a given file. This will also allow the user to download files.",
                    ),
                    (
                        "update",
                        "Allows to update the contents of an existing file or directory.",
                    ),
                    ("delete", "Allows to delete files or directories."),
                    ("archive", "Allows to archive the contents of a directory."),
                ]),
            },
        ),
        (
            "backups",
            PermissionGroup {
                description: "Permissions that control the ability to manage server backups.",
                permissions: IndexMap::from([
                    ("create", "Allows to create a new backup for the server."),
                    ("read", "Allows to view existing backups for the server."),
                    ("download", "Allows to download a backup for the server."),
                    ("restore", "Allows to restore a backup for the server."),
                    (
                        "update",
                        "Allows to update an existing backup for the server.",
                    ),
                    ("delete", "Allows to delete a backup for the server."),
                ]),
            },
        ),
        (
            "schedules",
            PermissionGroup {
                description: "Permissions that control the ability to manage server schedules.",
                permissions: IndexMap::from([
                    ("create", "Allows to create a new schedule for the server."),
                    ("read", "Allows to view existing schedules for the server."),
                    (
                        "update",
                        "Allows to update an existing schedule for the server.",
                    ),
                    ("delete", "Allows to delete a schedule for the server."),
                ]),
            },
        ),
        (
            "allocations",
            PermissionGroup {
                description: "Permissions that control the ability to modify the port allocations for this server.",
                permissions: IndexMap::from([
                    (
                        "read",
                        "Allows to view all allocations currently assigned to this server. Users with any level of access to this server can always view the primary allocation.",
                    ),
                    (
                        "create",
                        "Allows to assign additional allocations to the server.",
                    ),
                    (
                        "update",
                        "Allows to change the primary server allocation and attach notes to each allocation.",
                    ),
                    ("delete", "Allows to delete an allocation from the server."),
                ]),
            },
        ),
        (
            "startup",
            PermissionGroup {
                description: "Permissions that control the ability to view this server's startup parameters.",
                permissions: IndexMap::from([
                    ("read", "Allows to view the startup variables for a server."),
                    (
                        "update",
                        "Allows to modify the startup variables for the server.",
                    ),
                    (
                        "command",
                        "Allows to modify the command used to start the server.",
                    ),
                    (
                        "docker-image",
                        "Allows to modify the Docker image used when running the server.",
                    ),
                ]),
            },
        ),
        (
            "databases",
            PermissionGroup {
                description: "Permissions that control the ability to manage databases on this server.",
                permissions: IndexMap::from([
                    ("create", "Allows to create a new database for this server."),
                    (
                        "read",
                        "Allows to view the database associated with this server.",
                    ),
                    (
                        "read-password",
                        "Allows to view the password associated with a database instance for this server.",
                    ),
                    (
                        "update",
                        "Allows to rotate the password on a database instance. If the user does not have the view_password permission they will not see the updated password.",
                    ),
                    (
                        "delete",
                        "Allows to remove a database instance from this server.",
                    ),
                ]),
            },
        ),
        (
            "mounts",
            PermissionGroup {
                description: "Permissions that control the ability to manage server mounts.",
                permissions: IndexMap::from([
                    ("attach", "Allows to attach a new mount to the server."),
                    ("read", "Allows to view existing mounts for the server."),
                    ("detach", "Allows to detach a mount from the server."),
                ]),
            },
        ),
        (
            "settings",
            PermissionGroup {
                description: "Permissions that control the ability to manage settings on this server.",
                permissions: IndexMap::from([
                    (
                        "rename",
                        "Allows to rename this server and change the description of it.",
                    ),
                    ("timezone", "Allows to change the timezone for this server."),
                    (
                        "auto-kill",
                        "Allows to change the auto-kill settings for this server.",
                    ),
                    ("reinstall", "Allows to trigger a reinstall of this server."),
                ]),
            },
        ),
        (
            "activity",
            PermissionGroup {
                description: "Permissions that control the ability to view the activity log on this server.",
                permissions: IndexMap::from([(
                    "read",
                    "Allows to view the activity logs for the server.",
                )]),
            },
        ),
    ]))
});

#[inline]
pub fn validate_server_permissions(permissions: &[String]) -> Result<(), ValidationError> {
    SERVER_PERMISSIONS.validate_permissions(permissions)
}
