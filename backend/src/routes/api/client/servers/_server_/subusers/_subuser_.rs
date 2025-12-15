use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_subuser::ServerSubuser,
            user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use std::sync::Arc;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "subuser" = String,
            description = "The username of the subuser",
            example = "0x7d8",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, subuser)): Path<(String, String)>,
    ) -> ApiResponseResult {
        permissions.has_server_permission("subusers.delete")?;

        let subuser =
            match ServerSubuser::by_server_uuid_username(&state.database, server.uuid, &subuser)
                .await?
            {
                Some(subuser) => subuser,
                None => {
                    return ApiResponse::error("subuser not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        ServerSubuser::delete_by_uuids(&state.database, server.uuid, subuser.user.uuid).await?;

        activity_logger
            .log(
                "server:subuser.delete",
                serde_json::json!({
                    "username": subuser.user.username,
                    "email": subuser.user.email,
                }),
            )
            .await;

        tokio::spawn({
            let database = Arc::clone(&state.database);

            async move {
                tracing::debug!(server = %server.uuid, "removing subuser permissions in wings");

                let node = match server.node.fetch_cached(&state.database).await {
                    Ok(node) => node,
                    Err(err) => {
                        tracing::error!(server = %server.uuid, "failed to remove subuser permissions in wings: {:?}", err);

                        return;
                    }
                };

                if let Err(err) = node
                    .api_client(&database)
                    .post_servers_server_ws_permissions(
                        server.uuid,
                        &wings_api::servers_server_ws_permissions::post::RequestBody {
                            user_permissions: vec![wings_api::servers_server_ws_permissions::post::RequestBodyUserPermissions {
                                user: subuser.user.uuid,
                                permissions: Vec::new(),
                                ignored_files: Vec::new(),
                            }]
                        }
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to remove subuser permissions in wings: {:?}", err);
                }

                if let Err(err) = node
                    .api_client(&database)
                    .post_servers_server_ws_deny(
                        server.uuid,
                        &wings_api::servers_server_ws_deny::post::RequestBody {
                            jtis: vec![subuser.user.uuid.to_string().into()],
                        },
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to remove subuser permissions in wings: {:?}", err);
                }
            }
        });

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            server::{GetServer, GetServerActivityLogger},
            server_subuser::ServerSubuser,
            user::{GetPermissionManager, GetUser},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use std::sync::Arc;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(custom(function = "shared::permissions::validate_server_permissions"))]
        permissions: Option<Vec<compact_str::CompactString>>,
        ignored_files: Option<Vec<compact_str::CompactString>>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = UNAUTHORIZED, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
    ), params(
        (
            "server" = uuid::Uuid,
            description = "The server ID",
            example = "123e4567-e89b-12d3-a456-426614174000",
        ),
        (
            "subuser" = String,
            description = "The username of the subuser",
            example = "0x7d8",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        user: GetUser,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, subuser)): Path<(String, String)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(permissions) = &data.permissions
            && !user.admin
            && let Some(subuser_permissions) = &server.subuser_permissions
            && !permissions.iter().all(|p| subuser_permissions.contains(p))
        {
            return ApiResponse::error("permissions: more permissions than self")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_server_permission("subusers.update")?;

        let mut subuser =
            match ServerSubuser::by_server_uuid_username(&state.database, server.uuid, &subuser)
                .await?
            {
                Some(subuser) => subuser,
                None => {
                    return ApiResponse::error("subuser not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if subuser.user.uuid == user.uuid {
            return ApiResponse::error("cannot update permissions for self")
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(permissions) = data.permissions {
            subuser.permissions = permissions;
        }
        if let Some(ignored_files) = data.ignored_files {
            subuser.ignored_files = ignored_files;
        }

        sqlx::query!(
            "UPDATE server_subusers
            SET permissions = $1, ignored_files = $2
            WHERE server_subusers.server_uuid = $3 AND server_subusers.user_uuid = $4",
            &subuser.permissions as &[compact_str::CompactString],
            &subuser.ignored_files as &[compact_str::CompactString],
            server.uuid,
            subuser.user.uuid,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:subuser.update",
                serde_json::json!({
                    "username": subuser.user.username,
                    "email": subuser.user.email,
                    "permissions": subuser.permissions,
                    "ignored_files": subuser.ignored_files,
                }),
            )
            .await;

        tokio::spawn({
            let database = Arc::clone(&state.database);

            async move {
                tracing::debug!(server = %server.uuid, "updating subuser permissions in wings");

                let node = match server.node.fetch_cached(&state.database).await {
                    Ok(node) => node,
                    Err(err) => {
                        tracing::error!(server = %server.uuid, "failed to update subuser permissions in wings: {:?}", err);

                        return;
                    }
                };

                if let Err(err) = node
                    .api_client(&database)
                    .post_servers_server_ws_permissions(
                        server.uuid,
                        &wings_api::servers_server_ws_permissions::post::RequestBody {
                            user_permissions: vec![wings_api::servers_server_ws_permissions::post::RequestBodyUserPermissions {
                                user: subuser.user.uuid,
                                permissions: server.wings_permissions(&subuser.user).into_iter().map(compact_str::CompactString::from).collect(),
                                ignored_files: subuser.ignored_files,
                            }]
                        }
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to update subuser permissions in wings: {:?}", err);
                }
            }
        });

        ApiResponse::json(Response {}).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
