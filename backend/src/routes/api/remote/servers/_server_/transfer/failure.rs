use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::remote::{GetNode, servers::_server_::GetServer},
        },
    };
    use axum::http::StatusCode;
    use serde::Serialize;
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
    pub async fn route(state: GetState, node: GetNode, server: GetServer) -> ApiResponseResult {
        if server.destination_node_id.is_none() {
            return ApiResponse::error("server is not being transferred")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        if node.id != server.node.id {
            return ApiResponse::error("source node must call failure endpoint")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let (allocations, _) = tokio::try_join!(
            sqlx::query!(
                r#"
                SELECT server_allocations.id FROM server_allocations
                JOIN node_allocations ON node_allocations.id = server_allocations.allocation_id
                WHERE server_allocations.server_id = $1 AND node_allocations.node_id != $2
                "#,
                server.id,
                server.node.id
            )
            .fetch_all(state.database.read()),
            sqlx::query!(
                r#"
                UPDATE servers
                SET destination_allocation_id = NULL, destination_node_id = NULL
                WHERE servers.id = $1
                "#,
                server.id
            )
            .execute(&mut *transaction)
        )?;

        sqlx::query!(
            r#"
            DELETE FROM server_allocations
            WHERE server_allocations.id = ANY($1)
            "#,
            &allocations.into_iter().map(|a| a.id).collect::<Vec<_>>()
        )
        .execute(&mut *transaction)
        .await?;

        if let Ok(Some(destination_node)) = server.destination_node(&state.database).await {
            if let Err(err) = destination_node
                .api_client(&state.database)
                .delete_servers_server(server.uuid)
                .await
            {
                tracing::error!("failed to delete server on destination node: {:#?}", err);
            }
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
