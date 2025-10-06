use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::server::GetServer,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = CONFLICT, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ))]
    pub async fn route(state: GetState, server: GetServer) -> ApiResponseResult {
        if server.destination_node_uuid.is_none() {
            return ApiResponse::error("server is not being transferred")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let (allocations, _) = tokio::try_join!(
            sqlx::query!(
                r#"
                SELECT server_allocations.uuid FROM server_allocations
                JOIN node_allocations ON node_allocations.uuid = server_allocations.allocation_uuid
                WHERE server_allocations.server_uuid = $1 AND node_allocations.node_uuid != $2
                "#,
                server.uuid,
                server.node.uuid
            )
            .fetch_all(state.database.read()),
            sqlx::query!(
                r#"
                UPDATE servers
                SET destination_allocation_uuid = NULL, destination_node_uuid = NULL
                WHERE servers.uuid = $1
                "#,
                server.uuid
            )
            .execute(&mut *transaction)
        )?;

        sqlx::query!(
            r#"
            DELETE FROM server_allocations
            WHERE server_allocations.uuid = ANY($1)
            "#,
            &allocations.into_iter().map(|a| a.uuid).collect::<Vec<_>>()
        )
        .execute(&mut *transaction)
        .await?;

        if let Ok(Some(destination_node)) = server.destination_node(&state.database).await
            && let Err(err) = destination_node
                .api_client(&state.database)
                .delete_servers_server(server.uuid)
                .await
        {
            tracing::error!("failed to delete server on destination node: {:#?}", err);
        }

        transaction.commit().await?;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
