use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize)]
pub struct UserRecoveryCode {
    pub id: i32,

    pub code: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserRecoveryCode {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("user_recovery_codes");

        BTreeMap::from([
            (
                format!("{}.id", table),
                format!("{}id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.code", table),
                format!("{}code", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            id: row.get(format!("{}id", prefix).as_str()),
            code: row.get(format!("{}code", prefix).as_str()),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl UserRecoveryCode {
    #[inline]
    pub async fn create_all(
        database: &crate::database::Database,
        user_id: i32,
    ) -> Result<Vec<String>, sqlx::Error> {
        let mut codes = Vec::new();
        codes.reserve_exact(10);

        let mut transaction = database.write().begin().await?;

        for _ in 0..10 {
            let code = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 10);

            sqlx::query(
                r#"
                INSERT INTO user_recovery_codes (user_id, code, created)
                VALUES ($1, $2, NOW())
                "#,
            )
            .bind(user_id)
            .bind(&code)
            .execute(&mut *transaction)
            .await?;

            codes.push(code);
        }

        transaction.commit().await?;

        Ok(codes)
    }

    pub async fn delete_by_code(
        database: &crate::database::Database,
        user_id: i32,
        code: &str,
    ) -> Option<Self> {
        let row = sqlx::query(&format!(
            r#"
            DELETE FROM user_recovery_codes
            WHERE user_recovery_codes.user_id = $1 AND user_recovery_codes.code = $2
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(user_id)
        .bind(code)
        .fetch_optional(database.read())
        .await
        .unwrap()?;

        Some(Self::map(None, &row))
    }

    pub async fn delete_by_user_id(database: &crate::database::Database, user_id: i32) {
        sqlx::query(
            r#"
            DELETE FROM user_recovery_codes
            WHERE user_recovery_codes.user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(database.write())
        .await
        .unwrap();
    }
}
