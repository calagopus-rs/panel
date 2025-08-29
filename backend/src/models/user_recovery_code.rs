use super::BaseModel;
use rand::distr::SampleString;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize)]
pub struct UserRecoveryCode {
    pub code: String,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for UserRecoveryCode {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("user_recovery_codes");

        BTreeMap::from([
            (format!("{table}.code"), format!("{prefix}code")),
            (format!("{table}.created"), format!("{prefix}created")),
        ])
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            code: row.get(format!("{prefix}code").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl UserRecoveryCode {
    pub async fn create_all(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> Result<Vec<String>, sqlx::Error> {
        let mut codes = Vec::new();
        codes.reserve_exact(10);

        let mut transaction = database.write().begin().await?;

        for _ in 0..10 {
            let code = rand::distr::Alphanumeric.sample_string(&mut rand::rng(), 10);

            sqlx::query(
                r#"
                INSERT INTO user_recovery_codes (user_uuid, code, created)
                VALUES ($1, $2, NOW())
                "#,
            )
            .bind(user_uuid)
            .bind(&code)
            .execute(&mut *transaction)
            .await?;

            codes.push(code);
        }

        transaction.commit().await?;

        Ok(codes)
    }

    pub async fn delete_by_user_uuid_code(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
        code: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query(&format!(
            r#"
            DELETE FROM user_recovery_codes
            WHERE user_recovery_codes.user_uuid = $1 AND user_recovery_codes.code = $2
            RETURNING {}
            "#,
            Self::columns_sql(None, None)
        ))
        .bind(user_uuid)
        .bind(code)
        .fetch_optional(database.write())
        .await?;

        Ok(row.map(|row| Self::map(None, &row)))
    }

    pub async fn delete_by_user_uuid(
        database: &crate::database::Database,
        user_uuid: uuid::Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            DELETE FROM user_recovery_codes
            WHERE user_recovery_codes.user_uuid = $1
            "#,
        )
        .bind(user_uuid)
        .execute(database.write())
        .await?;

        Ok(())
    }
}
