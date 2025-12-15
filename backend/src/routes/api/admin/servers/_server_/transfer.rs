use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod post {
    use axum::http::StatusCode;
    use compact_str::ToCompactString;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        jwt::BasePayload,
        models::{
            ByUuid, admin_activity::GetAdminActivityLogger, node::Node, server::GetServer,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        node_uuid: uuid::Uuid,

        allocation_uuid: Option<uuid::Uuid>,
        allocation_uuids: Vec<uuid::Uuid>,

        backups: Vec<uuid::Uuid>,
        delete_source_backups: bool,
        archive_format: wings_api::TransferArchiveFormat,
        compression_level: Option<wings_api::CompressionLevel>,
        multiplex_channels: u64,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = CONFLICT, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_admin_permission("servers.transfer")?;

        if server.destination_node.is_some() {
            return ApiResponse::error("server is already being transferred")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        if data.node_uuid == server.node.uuid {
            return ApiResponse::error("cannot transfer server to the same node")
                .with_status(StatusCode::CONFLICT)
                .ok();
        }

        let destination_node = match Node::by_uuid_optional(&state.database, data.node_uuid).await?
        {
            Some(node) => node,
            None => {
                return ApiResponse::error("node not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let mut transaction = state.database.write().begin().await?;

        let destination_allocation_uuid = if let Some(allocation_uuid) = data.allocation_uuid {
            Some(
                sqlx::query!(
                    "INSERT INTO server_allocations (server_uuid, allocation_uuid)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    RETURNING uuid",
                    server.uuid,
                    allocation_uuid
                )
                .fetch_one(&mut *transaction)
                .await?
                .uuid,
            )
        } else {
            None
        };

        sqlx::query!(
            r#"
            UPDATE servers
            SET destination_node_uuid = $2, destination_allocation_uuid = $3
            WHERE servers.uuid = $1
            "#,
            server.uuid,
            destination_node.uuid,
            destination_allocation_uuid
        )
        .execute(&mut *transaction)
        .await?;

        if !data.allocation_uuids.is_empty() {
            sqlx::query!(
                r#"
                INSERT INTO server_allocations (server_uuid, allocation_uuid)
                SELECT $1, UNNEST($2::uuid[])
                ON CONFLICT DO NOTHING
                "#,
                server.uuid,
                &data.allocation_uuids
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
                jwt_id: server.node.uuid.to_string(),
            },
        )?;

        transaction.commit().await?;

        let mut url = destination_node.url;
        url.set_path("/api/transfers");

        if let Err(err) = server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .post_servers_server_transfer(
                server.uuid,
                &wings_api::servers_server_transfer::post::RequestBody {
                    url: url.to_compact_string(),
                    token: format!("Bearer {token}").into(),
                    backups: data.backups,
                    delete_backups: data.delete_source_backups,
                    archive_format: data.archive_format,
                    compression_level: data.compression_level,
                    multiplex_streams: data.multiplex_channels,
                },
            )
            .await
        {
            tracing::error!("failed to transfer server to node: {:?}", err);

            return ApiResponse::error("failed to transfer server to node")
                .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                .ok();
        }

        activity_logger
            .log(
                "server:transfer",
                serde_json::json!({
                    "uuid": server.uuid,
                    "destination_node_uuid": destination_node.uuid,
                    "allocation_uuid": destination_allocation_uuid,
                    "allocation_uuids": data.allocation_uuids,
                }),
            )
            .await;

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .with_state(state.clone())
}
