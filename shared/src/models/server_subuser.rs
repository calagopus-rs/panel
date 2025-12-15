use crate::{prelude::*, storage::StorageUrlRetriever};
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::{
    collections::BTreeMap,
    sync::{Arc, LazyLock},
};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerSubuser {
    pub user: super::user::User,
    pub server: Fetchable<super::server::Server>,

    pub permissions: Vec<compact_str::CompactString>,
    pub ignored_files: Vec<compact_str::CompactString>,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerSubuser {
    const NAME: &'static str = "server_subuser";

    #[inline]
    fn columns(prefix: Option<&str>) -> BTreeMap<&'static str, compact_str::CompactString> {
        let prefix = prefix.unwrap_or_default();

        let mut columns = BTreeMap::from([
            (
                "server_subusers.server_uuid",
                compact_str::format_compact!("{prefix}server_uuid"),
            ),
            (
                "server_subusers.permissions",
                compact_str::format_compact!("{prefix}permissions"),
            ),
            (
                "server_subusers.ignored_files",
                compact_str::format_compact!("{prefix}ignored_files"),
            ),
            (
                "server_subusers.created",
                compact_str::format_compact!("{prefix}created"),
            ),
        ]);

        columns.extend(super::user::User::columns(Some("user_")));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Result<Self, crate::database::DatabaseError> {
        let prefix = prefix.unwrap_or_default();

        Ok(Self {
            user: super::user::User::map(Some("user_"), row)?,
            server: super::server::Server::get_fetchable(
                row.try_get(compact_str::format_compact!("{prefix}server_uuid").as_str())?,
            ),
            permissions: row
                .try_get(compact_str::format_compact!("{prefix}permissions").as_str())?,
            ignored_files: row
                .try_get(compact_str::format_compact!("{prefix}ignored_files").as_str())?,
            created: row.try_get(compact_str::format_compact!("{prefix}created").as_str())?,
        })
    }
}

impl ServerSubuser {
    pub async fn create(
        database: &crate::database::Database,
        settings: &crate::settings::Settings,
        mail: &Arc<crate::mail::Mail>,
        server: &super::server::Server,
        email: &str,
        permissions: &[compact_str::CompactString],
        ignored_files: &[compact_str::CompactString],
    ) -> Result<compact_str::CompactString, crate::database::DatabaseError> {
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

                let app_settings = settings.get().await;

                let user = match super::user::User::create(
                    database,
                    None,
                    None,
                    &username,
                    email,
                    "Server",
                    "Subuser",
                    &password,
                    false,
                    &app_settings.app.language,
                )
                .await
                {
                    Ok(user_uuid) => super::user::User::by_uuid(database, user_uuid).await?,
                    Err(err) => {
                        tracing::error!(username = %username, email = %email, "failed to create subuser user: {:?}", err);

                        return Err(err);
                    }
                };
                drop(app_settings);

                match super::user_password_reset::UserPasswordReset::create(database, user.uuid)
                    .await
                {
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

                        super::user_activity::UserActivity::log(
                            database,
                            user.uuid,
                            None,
                            "email:account-created",
                            None,
                            serde_json::json!({}),
                        )
                        .await?;

                        mail.send(
                            user.email.clone(),
                            format!("{} - Account Created", settings.app.name).into(),
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
            )
            .into());
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
    ) -> Result<Option<Self>, crate::database::DatabaseError> {
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

        row.try_map(|row| Self::map(None, &row))
    }

    pub async fn by_server_uuid_with_pagination(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        page: i64,
        per_page: i64,
        search: Option<&str>,
    ) -> Result<super::Pagination<Self>, crate::database::DatabaseError> {
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

    pub async fn delete_by_uuids(
        database: &crate::database::Database,
        server_uuid: uuid::Uuid,
        user_uuid: uuid::Uuid,
    ) -> Result<(), crate::database::DatabaseError> {
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

#[async_trait::async_trait]
impl DeletableModel for ServerSubuser {
    type DeleteOptions = ();

    fn get_delete_listeners() -> &'static LazyLock<DeleteListenerList<Self>> {
        static DELETE_LISTENERS: LazyLock<DeleteListenerList<ServerSubuser>> =
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
            DELETE FROM server_subusers
            WHERE server_subusers.server_uuid = $1 AND server_subusers.user_uuid = $2
            "#,
        )
        .bind(self.server.uuid)
        .bind(self.user.uuid)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Ok(())
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerSubuser")]
pub struct ApiServerSubuser {
    pub user: super::user::ApiUser,

    pub permissions: Vec<compact_str::CompactString>,
    pub ignored_files: Vec<compact_str::CompactString>,

    pub created: chrono::DateTime<chrono::Utc>,
}
