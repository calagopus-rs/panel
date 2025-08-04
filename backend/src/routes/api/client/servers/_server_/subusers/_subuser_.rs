use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_subuser::ServerSubuser,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
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
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, subuser)): Path<(String, String)>,
    ) -> ApiResponseResult {
        if let Err(error) = server.has_permission("subusers.delete") {
            return ApiResponse::json(ApiError::new_value(&[&error]))
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let subuser =
            match ServerSubuser::by_server_id_username(&state.database, server.id, &subuser).await?
            {
                Some(subuser) => subuser,
                None => {
                    return ApiResponse::error("subuser not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        ServerSubuser::delete_by_ids(&state.database, server.id, subuser.user.id).await?;

        activity_logger
            .log(
                "server:subuser.delete",
                serde_json::json!({
                    "email": subuser.user.email,
                }),
            )
            .await;

        tokio::spawn({
            let database = Arc::clone(&state.database);

            async move {
                tracing::debug!(server = %server.uuid, "removing subuser permissions in wings");

                if let Err(err) = server
                    .node
                    .api_client(&database)
                    .post_servers_server_ws_permissions(
                        server.uuid,
                        &wings_api::servers_server_ws_permissions::post::RequestBody {
                            user_permissions: vec![wings_api::servers_server_ws_permissions::post::RequestBodyUserPermissions {
                                user: subuser.user.to_uuid(),
                                permissions: Vec::new(),
                                ignored_files: Vec::new(),
                            }]
                        }
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to remove subuser permissions in wings: {:#?}", err);
                }

                if let Err(err) = server
                    .node
                    .api_client(&database)
                    .post_servers_server_ws_deny(
                        server.uuid,
                        &wings_api::servers_server_ws_deny::post::RequestBody {
                            jtis: vec![subuser.user.id.to_string()],
                        },
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to remove subuser permissions in wings: {:#?}", err);
                }
            }
        });

        ApiResponse::json(Response {}).ok()
    }
}

mod patch {
    use crate::{
        models::server_subuser::ServerSubuser,
        response::{ApiResponse, ApiResponseResult},
        routes::{
            ApiError, GetState,
            api::client::{
                GetUser,
                servers::_server_::{GetServer, GetServerActivityLogger},
            },
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::{Deserialize, Serialize};
    use std::sync::Arc;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(custom(function = "crate::models::server_subuser::validate_permissions"))]
        permissions: Option<Vec<String>>,
        ignored_files: Option<Vec<String>>,
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
        user: GetUser,
        server: GetServer,
        activity_logger: GetServerActivityLogger,
        Path((_server, subuser)): Path<(String, String)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        if let Some(permissions) = &data.permissions {
            if !user.admin {
                if let Some(subuser_permissions) = &server.subuser_permissions {
                    if !permissions.iter().all(|p| subuser_permissions.contains(p)) {
                        return ApiResponse::error("permissions: more permissions than self")
                            .with_status(StatusCode::BAD_REQUEST)
                            .ok();
                    }
                }
            }
        }

        if let Err(error) = server.has_permission("subusers.update") {
            return ApiResponse::error(&error)
                .with_status(StatusCode::UNAUTHORIZED)
                .ok();
        }

        let mut subuser =
            match ServerSubuser::by_server_id_username(&state.database, server.id, &subuser).await?
            {
                Some(subuser) => subuser,
                None => {
                    return ApiResponse::error("subuser not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if subuser.user.id == user.id {
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
            WHERE server_subusers.server_id = $3 AND server_subusers.user_id = $4",
            &subuser.permissions,
            &subuser.ignored_files,
            server.id,
            subuser.user.id,
        )
        .execute(state.database.write())
        .await?;

        activity_logger
            .log(
                "server:subuser.update",
                serde_json::json!({
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

                if let Err(err) = server
                    .node
                    .api_client(&database)
                    .post_servers_server_ws_permissions(
                        server.uuid,
                        &wings_api::servers_server_ws_permissions::post::RequestBody {
                            user_permissions: vec![wings_api::servers_server_ws_permissions::post::RequestBodyUserPermissions {
                                user: subuser.user.to_uuid(),
                                permissions: server.wings_permissions(&subuser.user).into_iter().map(String::from).collect(),
                                ignored_files: subuser.ignored_files,
                            }]
                        }
                    )
                    .await
                {
                    tracing::error!(server = %server.uuid, "failed to update subuser permissions in wings: {:#?}", err);
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
