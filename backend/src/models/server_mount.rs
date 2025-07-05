use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct ServerMount {
    pub mount: super::mount::Mount,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for ServerMount {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("server_mounts");

        let mut columns = BTreeMap::from([
            (format!("{}.mount_id", table), format!("{}mount_id", prefix)),
            (format!("{}.created", table), format!("{}created", prefix)),
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

impl ServerMount {
    pub async fn new(database: &crate::database::Database, server_id: i32, mount_id: i32) -> bool {
        sqlx::query(
            r#"
            INSERT INTO server_mounts (server_id, mount_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(server_id)
        .bind(mount_id)
        .fetch_one(database.write())
        .await
        .is_ok()
    }

    pub async fn all_by_server_id(
        database: &crate::database::Database,
        server_id: i32,
    ) -> Vec<Self> {
        let rows = sqlx::query(&format!(
            r#"
            SELECT {}, {}
            FROM server_mounts
            JOIN mounts ON mounts.id = server_mounts.mount_id
            WHERE server_mounts.server_id = $1
            "#,
            Self::columns_sql(None, None),
            super::mount::Mount::columns_sql(Some("mount_"), None)
        ))
        .bind(server_id)
        .fetch_all(database.read())
        .await
        .unwrap();

        rows.into_iter().map(|row| Self::map(None, &row)).collect()
    }

    #[inline]
    pub fn into_api_object(self) -> ApiServerMount {
        ApiServerMount {
            name: self.mount.name,
            description: self.mount.description,
            target: self.mount.target,
            read_only: self.mount.read_only,
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "ServerMount")]
pub struct ApiServerMount {
    pub name: String,
    pub description: Option<String>,

    pub target: String,
    pub read_only: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
