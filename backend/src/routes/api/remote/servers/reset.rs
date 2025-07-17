use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::routes::{GetState, api::remote::GetNode};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(
        state: GetState,
        node: GetNode,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        let (_, backups) = tokio::try_join!(
            sqlx::query!(
                "UPDATE servers
                SET status = NULL
                WHERE servers.node_id = $1 AND servers.status = 'RESTORING_BACKUP'",
                node.id
            )
            .execute(state.database.write()),
            sqlx::query!(
                "SELECT server_backups.id FROM server_backups
                JOIN servers ON servers.id = server_backups.server_id
                WHERE servers.node_id = $1 AND server_backups.completed IS NULL",
                node.id
            )
            .fetch_all(state.database.read()),
        )
        .unwrap();

        sqlx::query!(
            "UPDATE server_backups
            SET successful = false, completed = NOW()
            WHERE server_backups.id = ANY($1)",
            &backups.into_iter().map(|b| b.id).collect::<Vec<_>>()
        )
        .execute(state.database.write())
        .await
        .unwrap();

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
