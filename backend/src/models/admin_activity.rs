use super::BaseModel;
use serde::{Deserialize, Serialize};
use sqlx::{Row, postgres::PgRow};
use std::collections::BTreeMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct AdminActivity {
    pub user: Option<super::user::User>,
    pub api_key_uuid: Option<uuid::Uuid>,

    pub event: String,
    pub ip: Option<sqlx::types::ipnetwork::IpNetwork>,
    pub data: serde_json::Value,

    pub created: chrono::NaiveDateTime,
}

impl BaseModel for AdminActivity {
    #[inline]
    fn columns(prefix: Option<&str>, table: Option<&str>) -> BTreeMap<String, String> {
        let prefix = prefix.unwrap_or_default();
        let table = table.unwrap_or("admin_activities");

        let mut columns = BTreeMap::from([
            (
                format!("{table}.api_key_uuid"),
                format!("{prefix}api_key_uuid"),
            ),
            (format!("{table}.event"), format!("{prefix}event")),
            (format!("{table}.ip"), format!("{prefix}ip")),
            (format!("{table}.data"), format!("{prefix}data")),
            (format!("{table}.created"), format!("{prefix}created")),
        ]);

        columns.extend(super::user::User::columns(Some("user_"), None));

        columns
    }

    #[inline]
    fn map(prefix: Option<&str>, row: &PgRow) -> Self {
        let prefix = prefix.unwrap_or_default();

        Self {
            user: if row
                .try_get::<uuid::Uuid, _>("user_uuid".to_string().as_str())
                .is_ok()
            {
                Some(super::user::User::map(Some("user_"), row))
            } else {
                None
            },
            api_key_uuid: row.get(format!("{prefix}api_key_uuid").as_str()),
            event: row.get(format!("{prefix}event").as_str()),
            ip: row.get(format!("{prefix}ip").as_str()),
            data: row.get(format!("{prefix}data").as_str()),
            created: row.get(format!("{prefix}created").as_str()),
        }
    }
}

impl AdminActivity {
    pub async fn log(
        database: &crate::database::Database,
        user_uuid: Option<uuid::Uuid>,
        api_key_uuid: Option<uuid::Uuid>,
        event: &str,
        ip: Option<sqlx::types::ipnetwork::IpNetwork>,
        data: serde_json::Value,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO admin_activities (user_uuid, api_key_uuid, event, ip, data)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(user_uuid)
        .bind(api_key_uuid)
        .bind(event)
        .bind(ip)
        .bind(data)
        .execute(database.write())
        .await?;

        Ok(())
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
            FROM admin_activities
            LEFT JOIN users ON users.uuid = admin_activities.user_uuid
            WHERE ($1 IS NULL OR admin_activities.event ILIKE '%' || $1 || '%' OR users.username ILIKE '%' || $1 || '%')
            ORDER BY admin_activities.created DESC
            LIMIT $2 OFFSET $3
            "#,
            Self::columns_sql(None, None),
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

    #[inline]
    pub fn into_admin_api_object(self) -> AdminApiAdminActivity {
        AdminApiAdminActivity {
            user: self.user.map(|user| user.into_api_object(false)),
            event: self.event,
            ip: self.ip.map(|ip| ip.ip().to_string()),
            data: self.data,
            is_api: self.api_key_uuid.is_some(),
            created: self.created.and_utc(),
        }
    }
}

#[derive(ToSchema, Serialize)]
#[schema(title = "AdminAdminActivity")]
pub struct AdminApiAdminActivity {
    pub user: Option<super::user::ApiUser>,

    pub event: String,
    pub ip: Option<String>,
    pub data: serde_json::Value,

    pub is_api: bool,

    pub created: chrono::DateTime<chrono::Utc>,
}
