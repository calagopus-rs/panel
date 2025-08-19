use super::BaseModel;
use crate::models::{user::User, user_password_reset::UserPasswordReset};
use indexmap::IndexMap;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::{BTreeMap, HashSet},
    sync::{Arc, LazyLock},
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

#[derive(Serialize, Deserialize)]
pub struct ServerSubuser {
    pub user: super::user::User,

    pub permissions: Vec<String>,
    pub ignored_files: Vec<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerSubuser {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_subusers");

        let mut columns = BTreeMap::from([
            (
                format!("{table}.permissions"),
                format!("{prefix}permissions"),
            ),
            (
                format!("{table}.ignored_files"),
                format!("{prefix}ignored_files"),
            ),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::user::User::columns(Some("user_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            user: super::user::User::map(Some("user_"), row),
            permissions: row.get(format!("{prefix}permissions").as_str()),
            ignored_files: row.get(format!("{prefix}ignored_files").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl ServerSubuser {
    pub async fn create(
        database: &crate::database::Database,
        settings: &crate::settings::Settings,
        mail: &Arc<crate::mail::Mail>,
        server: &super::server::Server,
        email: &str,
        permissions: &[String],
        ignored_files: &[String],
    ) -> Result<String, sqlx::Error> {
        let user = match super::user::User::by_email(database, email).await? {
            Some(user) => user,
            None => {
                let username = email
                    .split('@')
                    .next()
                    .unwrap_or("unknown")
                    .chars()
                    .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-')
                    .take(10)
                    .collect::<String>();
                let username = format!(
                    "{username}-{}",
                    rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 4)
                );
                let password = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 32);

                let user = match User::create(
                    database, &username, email, "Server", "Subuser", &password, false,
                )
                .await
                {
                    Ok(user) => user,
                    Err(err) => {
                        tracing::error!(username = %username, email = %email, "failed to create subuser user: {:#?}", err);

                        return Err(err);
                    }
                };

                match UserPasswordReset::create(database, user.uuid).await {
                    Ok(token) => {
                        let settings = settings.get().await;

                        let mail_content = crate::mail::MAIL_ACCOUNT_CREATED
                            .replace("{{app_name}}", &settings.app.name)
                            .replace("{{user_username}}", &user.username)
                            .replace(
                                "{{reset_link}}",
                                &format!(
                                    "{}/auth/reset-password?token={}",
                                    settings.app.url,
                                    urlencoding::encode(&token),
                                ),
                            );

                        mail.send(
                            user.email.clone(),
                            format!("{} - Account Created", settings.app.name),
                            mail_content,
                        )
                        .await;

                        user
                    }
                    Err(err) => {
                        tracing::warn!(
                            user = %user.uuid,
                            "failed to create subuser password reset token: {:#?}",
                            err
                        );

                        user
                    }
                }
            }
        };

        if server.owner.uuid == user.uuid {
            return Err(sqlx::Error::InvalidArgument(
                "cannot create subuser for server owner".into(),
            ));
        }

        sqlx::query(
            r#"
            INSERT INTO server_subusers (server_uuid, user_uuid, permissions, ignored_files)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(server.uuid)
        .bind(user.uuid)
        .bind(permissions)
        .bind(ignored_files)
        .execute(database.write())
        .await?;

        Ok(user.username)
    }

    pub async fn by_server_uuid_username(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        username: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}
            FROM server_subusers
            JOIN users ON users.uuid = server_subusers.user_uuid
            WHERE server_subusers.server_uuid = $1 AND users.username = $2
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_uuid)
        .bind(username)
        .fetch_optional(database.read())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, sqlx::Error> {
        let offset = (page - 1) * per_page;

        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, COUNT(*) OVER() AS total_count
            FROM server_subusers
            JOIN users ON users.uuid = server_subusers.user_uuid
            WHERE server_subusers.server_uuid = $1 AND ($2 IS NULL OR users.username ILIKE '%' || $2 || '%')
            ORDER BY server_subusers.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(server_uuid)
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

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        user_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM server_subusers
            WHERE server_subusers.server_uuid = $1 AND server_subusers.user_uuid = $2
            "#,
        )
        .bind(server_uuid)
        .bind(user_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerSubuser {
        ApiServerSubuser {
            user: self.user.into_api_object(false),
            permissions: self.permissions,
            ignored_files: self.ignored_files,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerSubuser")]
pub struct ApiServerSubuser {
    pub user: super::user::ApiUser,

    pub permissions: Vec<String>,
    pub ignored_files: Vec<String>,

    pub created: chrono::DateTime<chrono::Utc>,
}
