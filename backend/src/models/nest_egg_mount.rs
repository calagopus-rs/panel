use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct NestEggMount {
    pub mount: super::mount::Mount,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for NestEggMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let table = table.unwrap_or("nest_egg_mounts");

        let mut columns = BTreeMap::from([
            (
                format!("{}.mount_id", table),
                format!("{}mount_id", prefix.unwrap_or_default()),
            ),
            (
                format!("{}.created", table),
                format!("{}created", prefix.unwrap_or_default()),
            ),
        ]);

        columns.extend(super::mount::Mount::columns(Some("mount_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            mount: super::mount::Mount::map(Some("mount_"), row),
            created: row.get(format!("{}created", prefix).as_str()),
        }
    }
}

impl NestEggMount {
    pub async fn new(database: &crate::database::Database, egg_id: i32, mount_id: i32) -> bool {
        sqlx::query(
            r#"
            INSERT INTO nest_egg_mounts (egg_id, mount_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(egg_id)
        .bind(mount_id)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn all_by_egg_id(database: &crate::database::Database, egg_id: i32) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM nest_egg_mounts
            JOIN mounts ON nest_egg_mounts.mount_id = mounts.id
            WHERE nest_egg_mounts.egg_id = $1
            "#,
            Self::columns_sql(None, None),
            super::mount::Mount::columns_sql(Some("mount_"), None)
        ))
        .bind(egg_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    pub async fn delete_by_id(database: &crate::database::Database, id: i32) {
        sqlx::query(
            r#"
            DELETE FROM nest_egg_mounts
            WHERE nest_egg_mounts.id = $1
            "#,
        )
        .bind(id)
        .execute(database.write())
        .await
        .unwrap();
    }

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiNestEggMount {
        AdminApiNestEggMount {
            mount: self.mount.into_admin_api_object(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "NestEggMount")]
pub struct AdminApiNestEggMount {
    pub mount: super::mount::AdminApiMount,

    pub created: chrono::DateTime<chrono::Utc>,
}
