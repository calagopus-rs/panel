use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _server_;
mod external;

mod get {
    use axum::{extract::Query, http::StatusCode};
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::{
            Pagination, PaginationParamsWithSearch, server::Server, user::GetPermissionManager,
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        servers: Pagination<shared::models::server::AdminApiServer>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ), params(
        (
            "page" = i64, Query,
            description = "The page number",
            example = "1",
        ),
        (
            "per_page" = i64, Query,
            description = "The number of items per page",
            example = "10",
        ),
        (
            "search" = Option<String>, Query,
            description = "Search term for items",
        ),
    ))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        Query(params): Query<PaginationParamsWithSearch>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&params) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("servers.read")?;

        let servers = Server::all_with_pagination(
            &state.database,
            params.page,
            params.per_page,
            params.search.as_deref(),
        )
        .await?;

        let storage_url_retriever = state.storage.retrieve_urls().await;

        ApiResponse::json(Response {
            servers: servers
                .try_async_map(|server| {
                    server.into_admin_api_object(&state.database, &storage_url_retriever)
                })
                .await?,
        })
        .ok()
    }
}

mod post {
    use axum::http::StatusCode;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{
            ByUuid,
            admin_activity::GetAdminActivityLogger,
            backup_configurations::BackupConfiguration,
            nest_egg::NestEgg,
            nest_egg_variable::NestEggVariable,
            node::Node,
            server::Server,
            user::{GetPermissionManager, User},
        },
        response::{ApiResponse, ApiResponseResult},
    };
    use std::collections::HashMap;
    use utoipa::ToSchema;
    use validator::Validate;

    #[derive(ToSchema, Validate, Serialize, Deserialize)]
    pub struct PayloadVariable {
        #[validate(length(min = 1, max = 255))]
        #[schema(min_length = 1, max_length = 255)]
        env_variable: String,
        #[validate(length(max = 4096))]
        #[schema(max_length = 4096)]
        value: String,
    }

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        node_uuid: uuid::Uuid,
        owner_uuid: uuid::Uuid,
        egg_uuid: uuid::Uuid,
        backup_configuration_uuid: Option<uuid::Uuid>,

        allocation_uuid: Option<uuid::Uuid>,
        allocation_uuids: Vec<uuid::Uuid>,

        start_on_completion: bool,
        skip_installer: bool,

        #[validate(length(max = 255))]
        #[schema(max_length = 255)]
        external_id: Option<compact_str::CompactString>,
        #[validate(length(min = 3, max = 255))]
        #[schema(min_length = 3, max_length = 255)]
        name: compact_str::CompactString,
        #[validate(length(max = 1024))]
        #[schema(max_length = 1024)]
        description: Option<compact_str::CompactString>,

        limits: shared::models::server::ApiServerLimits,
        pinned_cpus: Vec<i16>,

        #[validate(length(min = 1, max = 8192))]
        #[schema(min_length = 1, max_length = 8192)]
        startup: compact_str::CompactString,
        #[validate(length(min = 2, max = 255))]
        #[schema(min_length = 2, max_length = 255)]
        image: compact_str::CompactString,
        #[schema(min_length = 3, max_length = 255, value_type = String)]
        timezone: Option<chrono_tz::Tz>,

        feature_limits: shared::models::server::ApiServerFeatureLimits,
        #[schema(inline)]
        variables: Vec<PayloadVariable>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        server: shared::models::server::AdminApiServer,
    }

    #[utoipa::path(post, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = BAD_REQUEST, body = ApiError),
        (status = NOT_FOUND, body = ApiError),
        (status = CONFLICT, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        axum::Json(data): axum::Json<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::json(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("servers.create")?;

        let node = match Node::by_uuid_optional(&state.database, data.node_uuid).await? {
            Some(node) => node,
            None => {
                return ApiResponse::error("node not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let owner = match User::by_uuid_optional(&state.database, data.owner_uuid).await? {
            Some(user) => user,
            None => {
                return ApiResponse::error("owner not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let egg = match NestEgg::by_uuid_optional(&state.database, data.egg_uuid).await? {
            Some(egg) => egg,
            None => {
                return ApiResponse::error("egg not found")
                    .with_status(StatusCode::NOT_FOUND)
                    .ok();
            }
        };

        let backup_configuration = if let Some(backup_configuration_uuid) =
            data.backup_configuration_uuid
            && !backup_configuration_uuid.is_nil()
        {
            match BackupConfiguration::by_uuid_optional(&state.database, backup_configuration_uuid)
                .await?
            {
                Some(backup_configuration) => Some(backup_configuration),
                None => {
                    return ApiResponse::error("backup configuration not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            }
        } else {
            None
        };

        let variables = NestEggVariable::all_by_egg_uuid(&state.database, egg.uuid).await?;

        let mut validator_variables = HashMap::new();
        validator_variables.reserve(variables.len());

        for variable in variables.iter() {
            validator_variables.insert(
                variable.env_variable.as_str(),
                (
                    variable.rules.as_slice(),
                    if let Some(value) = data
                        .variables
                        .iter()
                        .find(|v| v.env_variable == variable.env_variable)
                    {
                        value.value.as_str()
                    } else {
                        variable.default_value.as_ref().map_or("", |v| v.as_str())
                    },
                ),
            );
        }

        let validator = match rule_validator::Validator::new(validator_variables) {
            Ok(validator) => validator,
            Err(error) => {
                return ApiResponse::error(&error)
                    .with_status(StatusCode::BAD_REQUEST)
                    .ok();
            }
        };

        if let Err(error) = validator.validate() {
            return ApiResponse::error(&error)
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        let mut server_variables = HashMap::new();
        server_variables.reserve(variables.len());

        for data_variable in &data.variables {
            let variable_uuid = match variables
                .iter()
                .find(|v| v.env_variable == data_variable.env_variable)
            {
                Some(variable) => variable.uuid,
                None => continue,
            };

            server_variables.insert(variable_uuid, data_variable.value.as_str());
        }

        let server = match Server::create(
            &state.database,
            &node,
            owner.uuid,
            egg.uuid,
            backup_configuration.map(|backup_configuration| backup_configuration.uuid),
            data.allocation_uuid,
            &data.allocation_uuids,
            data.external_id.as_deref(),
            data.start_on_completion,
            data.skip_installer,
            &data.name,
            data.description.as_deref(),
            &data.limits,
            &data.pinned_cpus,
            &data.startup,
            &data.image,
            data.timezone.as_ref().map(|tz| tz.name()),
            &data.feature_limits,
            &server_variables,
        )
        .await
        {
            Ok(server_uuid) => Server::by_uuid(&state.database, server_uuid).await?,
            Err(err) if err.is_unique_violation() => {
                return ApiResponse::error("server with allocation(s) already exists")
                    .with_status(StatusCode::CONFLICT)
                    .ok();
            }
            Err(err) => {
                tracing::error!("failed to create server: {:?}", err);

                return ApiResponse::error(&format!("failed to create server: {err}"))
                    .with_status(StatusCode::INTERNAL_SERVER_ERROR)
                    .ok();
            }
        };

        activity_logger
            .log(
                "server:create",
                serde_json::json!({
                    "uuid": server.uuid,
                    "node_uuid": node.uuid,
                    "owner_uuid": owner.uuid,
                    "egg_uuid": egg.uuid,

                    "allocation_uuid": data.allocation_uuid,
                    "allocation_uuids": data.allocation_uuids,
                    "external_id": data.external_id,

                    "start_on_completion": data.start_on_completion,
                    "skip_installer": data.skip_installer,

                    "name": data.name,
                    "description": data.description,
                    "limits": data.limits,
                    "pinned_cpus": data.pinned_cpus,
                    "startup": data.startup,
                    "image": data.image,
                    "timezone": data.timezone,
                    "feature_limits": data.feature_limits,
                    "variables": data.variables,
                }),
            )
            .await;

        ApiResponse::json(Response {
            server: server
                .into_admin_api_object(&state.database, &state.storage.retrieve_urls().await)
                .await?,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(post::route))
        .nest("/{server}", _server_::router(state))
        .nest("/external", external::router(state))
        .with_state(state.clone())
}
