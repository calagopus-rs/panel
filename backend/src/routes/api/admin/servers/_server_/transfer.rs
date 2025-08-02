use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use crate::{
        jwt::BasePayload,
        models::node::Node,
        response::{ApiResponse, ApiResponseResult},
        routes::{ApiError, GetState, api::admin::servers::_server_::GetServer},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        node_id: i32,

        allocation_id: Option<i32>,
        allocation_ids: Vec<i32>,

        backups: Vec<uuid::Uuid>,
        delete_source_backups: bool,
        archive_format: wings_api::TransferArchiveFormat,
        compression_level: Option<wings_api::CompressionLevel>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = CONFLICT, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        server: GetServer,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if server.destination_node_id.is_some() {
            return ApiResponse::error("server is already being transferred")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        if data.node_id == server.node.id {
            return ApiResponse::error("cannot transfer server to the same node")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        let destination_node = match Node::by_id(&state.database, data.node_id).await? {
            Some(node) => node,
            None => {
                return ApiResponse::error("node not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let mut transaction = state.database.write().begin().await?;

        let destination_allocation_id = if let Some(allocation_id) = data.allocation_id {
            Some(
                sqlx::query!(
                    "INSERT INTO server_allocations (server_id, allocation_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                RETURNING id",
                    server.id,
                    allocation_id
                )
                .fetch_one(&mut *transaction)
                .await?
                .id,
            )
        } else {
            None
        };

        sqlx::query!(
            r#"
            UPDATE servers
            SET destination_node_id = $2, destination_allocation_id = $3
            WHERE servers.id = $1
            "#,
            server.id,
            destination_node.id,
            destination_allocation_id
        )
        .execute(&mut *transaction)
        .await?;

        if !data.allocation_ids.is_empty() {
            sqlx::query!(
                r#"
                INSERT INTO server_allocations (server_id, allocation_id)
                SELECT $1, UNNEST($2::int[])
                ON CONFLICT DO NOTHING
                "#,
                server.id,
                &data.allocation_ids
            )
            .execute(&mut *transaction)
            .await?;
        }

        let token = destination_node.create_jwt(
            &state.database,
            &state.jwt,
            &BasePayload {
                issuer: "panel".into(),
                subject: Some(server.uuid.to_string()),
                audience: Vec::new(),
                expiration_time: Some(chrono::Utc::now().timestamp() + 600),
                not_before: None,
                issued_at: Some(chrono::Utc::now().timestamp()),
                jwt_id: server.node.id.to_string(),
            },
        )?;

        let mut url = destination_node.url;
        url.set_path("/api/transfers");

        match server
            .node
            .api_client(&state.database)
            .post_servers_server_transfer(
                server.uuid,
                &wings_api::servers_server_transfer::post::RequestBody {
                    url: url.to_string(),
                    token: format!("Bearer {token}"),
                    backups: data.backups,
                    delete_backups: data.delete_source_backups,
                    archive_format: data.archive_format,
                    compression_level: data.compression_level,
                },
            )
            .await
        {
            Ok(_) => {
                transaction.commit().await?;
            }
            Err(err) => {
                tracing::error!("failed to transfer server to node: {:#?}", err);
                transaction.rollback().await?;

                return ApiResponse::error("failed to transfer server to node")
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        }

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
