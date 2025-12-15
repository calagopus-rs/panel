use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod cancel;
mod unlock;

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        truncate_directory: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(post, path = "/", responses(
        (status = ACCEPTED, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
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
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("settings.install")?;

        let mut transaction = state.database.write().begin().await?;

        let rows_affected = sqlx::query!(
            "UPDATE servers
            SET status = 'INSTALLING'
            WHERE servers.uuid = $1 AND servers.status IS NULL",
            server.uuid
        )
        .execute(&mut *transaction)
        .await?
        .rows_affected();

        if rows_affected == 0 {
            transaction.rollback().await?;

            return ApiResponse::error("server is not in a valid state to reinstall.")
                .with_status(StatusCode::EXPECTATION_FAILED)
                .ok();
        }

        match server
            .node
            .fetch_cached(&state.database)
            .await?
            .api_client(&state.database)
            .post_servers_server_reinstall(
                server.uuid,
                &wings_api::servers_server_reinstall::post::RequestBody {
                    truncate_directory: data.truncate_directory,
                    installation_script: Some(wings_api::InstallationScript {
                        container_image: server.0.egg.config_script.container,
                        entrypoint: server.0.egg.config_script.entrypoint,
                        script: server.0.egg.config_script.content.into(),
                        environment: Default::default(),
                    }),
                },
            )
            .await
        {
            Ok(_) => {}
            Err(err) => {
                transaction.rollback().await?;

                return Err(err.into());
            }
        };

        transaction.commit().await?;

        activity_logger
            .log(
                "server:settings.install",
                serde_json::json!({
                    "truncate_directory": data.truncate_directory
                }),
            )
            .await;

        ApiResponse::json(Response {})
            .with_status(StatusCode::ACCEPTED)
            .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(post::route))
        .nest("/cancel", cancel::router(state))
        .nest("/unlock", unlock::router(state))
        .with_state(state.clone())
}
