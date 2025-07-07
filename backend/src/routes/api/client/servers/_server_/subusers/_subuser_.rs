use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod delete {
    use crate::{
        models::server_subuser::ServerSubuser,
        routes::{
            ApiError, GetState,
            api::client::servers::_server_::{GetServer, GetServerActivityLogger},
        },
    };
    use axum::{extract::Path, http::StatusCode};
    use serde::Serialize;
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
        Path((_server, subuser)): Path<(uuid::Uuid, String)>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(error) = server.has_permission("subusers.delete") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let subuser = match ServerSubuser::by_server_id_username(
            &state.database,
            server.id,
            &subuser,
        )
        .await
        {
            Some(subuser) => subuser,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["subuser not found"])),
                );
            }
        };

        ServerSubuser::delete_by_ids(&state.database, server.id, subuser.user.id).await;

        activity_logger
            .log(
                "server:subuser.delete",
                serde_json::json!({
                    "email": subuser.user.email,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

mod patch {
    use crate::{
        models::server_subuser::ServerSubuser,
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
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[validate(custom(function = "crate::models::server_subuser::validate_permissions"))]
        permissions: Vec<String>,
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
        Path((_server, subuser)): Path<(uuid::Uuid, String)>,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if !user.admin
            && let Some(subuser_permissions) = &server.subuser_permissions
            && !data
                .permissions
                .iter()
                .all(|p| subuser_permissions.contains(p))
        {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&[
                    "permissions: more permissions than self",
                ])),
            );
        }

        if let Err(error) = server.has_permission("subusers.update") {
            return (
                StatusCode::UNAUTHORIZED,
                axum::Json(ApiError::new_value(&[&error])),
            );
        }

        let subuser = match ServerSubuser::by_server_id_username(
            &state.database,
            server.id,
            &subuser,
        )
        .await
        {
            Some(subuser) => subuser,
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    axum::Json(ApiError::new_value(&["subuser not found"])),
                );
            }
        };

        if subuser.user.id == user.id {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_value(&["cannot update permissions for self"])),
            );
        }

        sqlx::query!(
            "UPDATE server_subusers
            SET permissions = $1
            WHERE server_id = $2 AND user_id = $3",
            &data.permissions,
            server.id,
            subuser.user.id,
        )
        .execute(state.database.write())
        .await
        .unwrap();

        activity_logger
            .log(
                "server:subuser.update",
                serde_json::json!({
                    "email": subuser.user.email,
                    "permissions": data.permissions,
                }),
            )
            .await;

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .with_state(state.clone())
}
