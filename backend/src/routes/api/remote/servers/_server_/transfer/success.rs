use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{node::GetNode, server::GetServer},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        backups: Vec<uuid::Uuid>,
    }

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
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        node: GetNode,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        let destination_node = match &server.destination_node {
            Some(id) => id,
            None => {
                return ApiResponse::error("server is not being transferred")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
        };

        if node.uuid != destination_node.uuid {
            return ApiResponse::error("destination node must call success endpoint")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let (allocations, _) = tokio::try_join!(
            sqlx::query!(
                r#"
                SELECT server_allocations.uuid, node_allocations.node_uuid FROM server_allocations
                JOIN node_allocations ON node_allocations.uuid = server_allocations.allocation_uuid
                WHERE server_allocations.server_uuid = $1 AND node_allocations.node_uuid != $2
                "#,
                server.uuid,
                destination_node.uuid
            )
            .fetch_all(state.database.read()),
            sqlx::query!(
                r#"
                UPDATE servers
                SET node_uuid = $1, allocation_uuid = $2, destination_allocation_uuid = NULL, destination_node_uuid = NULL
                WHERE servers.uuid = $3
                "#,
                destination_node.uuid,
                server.destination_allocation_uuid,
                server.uuid
            )
            .execute(&mut *transaction)
        )?;

        sqlx::query!(
            r#"
            UPDATE server_backups
            SET node_uuid = $3
            WHERE server_backups.server_uuid = $1 AND server_backups.uuid = ANY($2)
            "#,
            server.uuid,
            &data.backups,
            destination_node.uuid
        )
        .execute(&mut *transaction)
        .await?;
        sqlx::query!(
            r#"
            DELETE FROM server_allocations
            WHERE server_allocations.uuid = ANY($1)
            "#,
            &allocations.into_iter().map(|a| a.uuid).collect::<Vec<_>>()
        )
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        if let Err(err) = server
            .node
            .fetch(&state.database)
            .await?
            .api_client(&state.database)
            .delete_servers_server(server.uuid)
            .await
        {
            tracing::error!("failed to delete server on source node: {:#?}", err);
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
