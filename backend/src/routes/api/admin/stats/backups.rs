use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct ResponseStats {
        total: i64,
        successful: i64,
        successful_bytes: i64,
        failed: i64,
        deleted: i64,
        deleted_bytes: i64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        today: ResponseStats,
        #[schema(inline)]
        week: ResponseStats,
        #[schema(inline)]
        month: ResponseStats,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("stats.read")?;

        let (today, week, month) = tokio::try_join!(
            sqlx::query_as_unchecked!(
                ResponseStats,
                "SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE server_backups.successful = true) as successful,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.successful = true), 0)::int8 as successful_bytes,
                    COUNT(*) FILTER (WHERE server_backups.successful = false) as failed,
                    COUNT(*) FILTER (WHERE server_backups.deleted IS NOT NULL) as deleted,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.deleted IS NOT NULL), 0)::int8 as deleted_bytes
                FROM server_backups
                WHERE server_backups.completed IS NOT NULL
                    AND server_backups.completed >= CURRENT_DATE"
            )
            .fetch_one(state.database.read()),
            sqlx::query_as_unchecked!(
                ResponseStats,
                "SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE server_backups.successful = true) as successful,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.successful = true), 0)::int8 as successful_bytes,
                    COUNT(*) FILTER (WHERE server_backups.successful = false) as failed,
                    COUNT(*) FILTER (WHERE server_backups.deleted IS NOT NULL) as deleted,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.deleted IS NOT NULL), 0)::int8 as deleted_bytes
                FROM server_backups
                WHERE server_backups.completed IS NOT NULL
                    AND server_backups.completed >= CURRENT_DATE - INTERVAL '7 days'"
            )
            .fetch_one(state.database.read()),
            sqlx::query_as_unchecked!(
                ResponseStats,
                "SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE server_backups.successful = true) as successful,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.successful = true), 0)::int8 as successful_bytes,
                    COUNT(*) FILTER (WHERE server_backups.successful = false) as failed,
                    COUNT(*) FILTER (WHERE server_backups.deleted IS NOT NULL) as deleted,
                    COALESCE(SUM(server_backups.bytes) FILTER (WHERE server_backups.deleted IS NOT NULL), 0)::int8 as deleted_bytes
                FROM server_backups
                WHERE server_backups.completed IS NOT NULL
                    AND server_backups.completed >= CURRENT_DATE - INTERVAL '30 days'"
            )
            .fetch_one(state.database.read())
        )?;

        ApiResponse::json(Response { today, week, month }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
