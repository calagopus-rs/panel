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
    use serde::{Deserialize, Serialize};
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
        let destination_node_id = match server.destination_node_id {
            Some(id) => id,
            None => {
                return ApiResponse::error("server is not being transferred")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
        };

        if node.id != destination_node_id {
            return ApiResponse::error("destination node must call success endpoint")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        let mut transaction = state.database.write().begin().await?;

        let (allocations, _) = tokio::try_join!(
            sqlx::query!(
                r#"
                SELECT server_allocations.id, node_allocations.node_id FROM server_allocations
                JOIN node_allocations ON node_allocations.id = server_allocations.allocation_id
                WHERE server_allocations.server_id = $1 AND node_allocations.node_id != $2
                "#,
                server.id,
                destination_node_id
            )
            .fetch_all(state.database.read()),
            sqlx::query!(
                r#"
                UPDATE servers
                SET node_id = $1, allocation_id = $2, destination_allocation_id = NULL, destination_node_id = NULL
                WHERE servers.id = $3
                "#,
                destination_node_id,
                server.destination_allocation_id,
                server.id
            )
            .execute(&mut *transaction)
        )?;

        sqlx::query!(
            r#"
            UPDATE server_backups
            SET node_id = $3
            WHERE server_backups.server_id = $1 AND server_backups.uuid = ANY($2)
            "#,
            server.id,
            &data.backups,
            destination_node_id
        )
        .execute(&mut *transaction)
        .await?;
        sqlx::query!(
            r#"
            DELETE FROM server_allocations
            WHERE server_allocations.id = ANY($1)
            "#,
            &allocations.into_iter().map(|a| a.id).collect::<Vec<_>>()
        )
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        if let Err(err) = server
            .node
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
