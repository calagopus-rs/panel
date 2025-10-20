use super::BaseModel;
use crate::{
    models::{user::User, user_password_reset::UserPasswordReset},
    storage::StorageUrlRetriever,
};
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{collections::BTreeMap, sync::Arc};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerSubuser {
    pub user: super::user::User,

    pub permissions: Vec<String>,
    pub ignored_files: Vec<String>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerSubuser {
    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, String> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            (
                "server_subusers.permissions",
                format!("{prefix}permissions"),
            ),
            (
                "server_subusers.ignored_files",
                format!("{prefix}ignored_files"),
            ),
            ("server_subusers.created", format!("{prefix}created")),
        ]);

        columns.extend(super::user::User::columns(Some("user_")));

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
                    .filter(|c| c.is_alphanumeric() || *c == '_')
                    .take(10)
                    .collect::<String>();
                let username = format!(
                    "{username}_{}",
                    rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 4)
                );
                let password = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 32);

                let user = match User::create(
                    database, &username, email, "Server", "Subuser", &password, false,
                )
                .await
                {
                    Ok(user_uuid) => User::by_uuid(database, user_uuid)
                        .await?
                        .ok_or(sqlx::Error::RowNotFound)?,
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
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE server_subusers.server_uuid = $1 AND users.username = $2
            "#,
            Self::columns_sql(None)
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
            LEFT JOIN roles ON roles.uuid = users.role_uuid
            WHERE server_subusers.server_uuid = $1 AND ($2 IS NULL OR users.username ILIKE '%' || $2 || '%')
            ORDER BY server_subusers.created
            LIMIT $3 OFFSET $4
            "#,
            Self::columns_sql(None)
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
    pub fn into_api_object(
        self,
        storage_url_retriever: &StorageUrlRetriever<'_>,
    ) -> ApiServerSubuser {
        ApiServerSubuser {
            user: self.user.into_api_object(storage_url_retriever),
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
