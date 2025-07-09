use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize)]
pub struct UserPasswordReset {
    pub id: i32,
    pub user: super::user::User,

    pub token: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserPasswordReset {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("user_password_resets");

        let mut columns = BTreeMap::from([
            (format!("{table}.id"), format!("{prefix}id")),
            (format!("{table}.token"), format!("{prefix}token")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::user::User::columns(Some("user_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{prefix}id").as_str()),
            user: super::user::User::map(Some("user_"), row),
            token: row.get(format!("{prefix}token").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserPasswordReset {
    #[inline]
    pub async fn create(
        database: &crate::database::Database,
        user_id: i32,
    ) -> Result<String, sqlx::Error> {
        let existing = sqlx::query(
            r#"
            SELECT COUNT(*)
            FROM user_password_resets
            WHERE
                user_password_resets.user_id = $1
                AND user_password_resets.created > NOW() - INTERVAL '20 minutes'
            "#,
        )
        .bind(user_id)
        .fetch_optional(database.read())
        .await?;

        if let Some(row) = existing {
            if row.get::<i64, _>(0) > 0 {
                return Err(sqlx::Error::RowNotFound);
            }
        }

        let token = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 96);

        sqlx::query(
            r#"
            INSERT INTO user_password_resets (user_id, token, created)
            VALUES ($1, crypt($2, gen_salt('bf')), NOW())
            "#,
        )
        .bind(user_id)
        .bind(&token)
        .execute(database.write())
        .await?;

        Ok(token)
    }

    pub async fn delete_by_token(
        database: &crate::database::Database,
        token: &str,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            SELECT {}, {} FROM user_password_resets
            JOIN users ON users.id = user_password_resets.user_id
            WHERE
                user_password_resets.token = crypt($1, user_password_resets.token)
                AND user_password_resets.created > NOW() - INTERVAL '20 minutes'
            "#,
            Self::columns_sql(None, None),
            super::user::User::columns_sql(Some("user_"), None)
        ))
        .bind(token)
        .fetch_optional(database.read())
        .await
        .unwrap()?;

        sqlx::query(
            r#"
            DELETE FROM user_password_resets
            WHERE user_password_resets.id = $1
            "#,
        )
        .bind(row.get::<i32, _>("id"))
        .execute(database.write())
        .await
        .ok()?;

        Some(Self::map(None, &row))
    }
}
