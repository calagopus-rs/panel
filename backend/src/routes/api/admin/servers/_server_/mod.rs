use super::State;
use crate::{
    models::server::Server,
    routes::{ApiError, GetState},
};
use axum::{
    body::Body,
    extract::{Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use utoipa_axum::{router::OpenApiRouter, routes};

mod variables;

pub type GetServer = crate::extract::ConsumingExtension<Server>;

pub async fn auth(
    state: GetState,
    Path(server): Path<Vec<String>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let server = Server::by_identifier(&state.database, &server[0]).await;
    let server = match server {
        Some(server) => server,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&ApiError::new_value(&["server not found"])).unwrap(),
                ))
                .unwrap());
        }
    };

    req.extensions_mut().insert(server);

    Ok(next.run(req).await)
}

mod get {
    use crate::routes::{ApiError, api::admin::servers::_server_::GetServer};
    use axum::http::StatusCode;
    use serde::Serialize;
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: crate::models::server::AdminApiServer,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
    ))]
    pub async fn route(server: GetServer) -> (StatusCode, axum::Json<serde_json::Value>) {
        (
            StatusCode::OK,
            axum::Json(
                serde_json::to_value(Response {
                    server: server.0.into_admin_api_object(),
                })
                .unwrap(),
            ),
        )
    }
}

mod delete {
    use crate::routes::{
        ApiError, GetState,
        api::{admin::servers::_server_::GetServer, client::GetUserActivityLogger},
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(ToSchema, Deserialize)]
    pub struct Payload {
        force: bool,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(delete, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = EXPECTATION_FAILED, body = ApiError),
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
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(err) = server.delete(&state.database, data.force).await {
            return (
                StatusCode::EXPECTATION_FAILED,
                axum::Json(ApiError::new_value(&[&format!(
                    "failed to delete server: {err}"
                )])),
            );
        }

        activity_logger
            .log(
                "admin:server.delete",
                serde_json::json!({
                    "server": server.uuid,

                    "name": server.name,
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
        models::{nest_egg::NestEgg, user::User},
        routes::{
            ApiError, GetState,
            api::{admin::servers::_server_::GetServer, client::GetUserActivityLogger},
        },
    };
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        owner_id: Option<i32>,
        egg_id: Option<i32>,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<String>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: Option<String>,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<String>,

        limits: Option<crate::models::server::ApiServerLimits>,
        pinned_cpus: Option<Vec<i16>>,

        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        startup: Option<String>,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        image: Option<String>,

        feature_limits: Option<crate::models::server::ApiServerFeatureLimits>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {}

    #[utoipa::path(patch, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
        (status = BAD_REQUEST, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), params(
        (
            "server" = i32,
            description = "The server ID",
            example = "1",
        ),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        mut server: GetServer,
        activity_logger: GetUserActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> (StatusCode, axum::Json<serde_json::Value>) {
        if let Err(errors) = crate::utils::validate_data(&data) {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiError::new_strings_value(errors)),
            );
        }

        if let Some(owner_id) = data.owner_id {
            let owner = match User::by_id(&state.database, owner_id).await {
                Some(owner) => owner,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["owner not found"])),
                    );
                }
            };

            server.owner = owner;
        }
        if let Some(egg_id) = data.egg_id {
            let egg = match NestEgg::by_id(&state.database, egg_id).await {
                Some(egg) => egg,
                None => {
                    return (
                        StatusCode::NOT_FOUND,
                        axum::Json(ApiError::new_value(&["egg not found"])),
                    );
                }
            };

            server.egg = egg;
        }
        if let Some(external_id) = &data.external_id {
            if external_id.is_empty() {
                server.external_id = None;
            } else {
                server.external_id = Some(external_id.to_string());
            }
        }
        if let Some(name) = data.name {
            server.name = name;
        }
        if let Some(description) = data.description {
            if description.is_empty() {
                server.description = None;
            } else {
                server.description = Some(description);
            }
        }
        if let Some(limits) = &data.limits {
            server.cpu = limits.cpu;
            server.memory = limits.memory;
            server.swap = limits.swap;
            server.disk = limits.disk;
            server.io_weight = limits.io_weight;
        }
        if let Some(pinned_cpus) = data.pinned_cpus {
            server.pinned_cpus = pinned_cpus;
        }
        if let Some(startup) = data.startup {
            server.startup = startup;
        }
        if let Some(image) = data.image {
            server.image = image;
        }
        if let Some(feature_limits) = &data.feature_limits {
            server.allocation_limit = feature_limits.allocations;
            server.backup_limit = feature_limits.backups;
            server.database_limit = feature_limits.databases;
        }

        match sqlx::query!(
            "UPDATE servers
            SET
                owner_id = $1, egg_id = $2, external_id = $3,
                name = $4, description = $5, cpu = $6, memory = $7,
                swap = $8, disk = $9, io_weight = $10, pinned_cpus = $11,
                startup = $12, image = $13, allocation_limit = $14,
                backup_limit = $15, database_limit = $16
            WHERE id = $17",
            server.owner.id,
            server.egg.id,
            server.external_id,
            server.name,
            server.description,
            server.cpu,
            server.memory,
            server.swap,
            server.disk,
            server.io_weight,
            &server.pinned_cpus,
            server.startup,
            server.image,
            server.allocation_limit,
            server.backup_limit,
            server.database_limit,
            server.id,
        )
        .execute(state.database.write())
        .await
        {
            Ok(_) => {}
            Err(err) => {
                tracing::error!("failed to update server: {:#?}", err);

                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    axum::Json(ApiError::new_value(&[&format!(
                        "failed to update server: {err}"
                    )])),
                );
            }
        }

        activity_logger
            .log(
                "admin:server.update",
                serde_json::json!({
                    "server_id": server.id,
                    "owner_id": server.owner.id,
                    "egg_id": server.egg.id,

                    "external_id": server.external_id,
                    "name": server.name,
                    "description": server.description,
                    "limits": data.limits,
                    "pinned_cpus": server.pinned_cpus,
                    "startup": server.startup,
                    "image": server.image,
                    "feature_limits": data.feature_limits,
                }),
            )
            .await;

        tokio::spawn(async move {
            if let Err(err) = server
                .node
                .api_client(&state.database)
                .post_servers_server_sync(server.uuid)
                .await
            {
                tracing::error!("failed to sync server on node: {:#?}", err);
            }
        });

        (
            StatusCode::OK,
            axum::Json(serde_json::to_value(Response {}).unwrap()),
        )
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(delete::route))
        .routes(routes!(patch::route))
        .nest("/variables", variables::router(state))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), auth))
        .with_state(state.clone())
}
