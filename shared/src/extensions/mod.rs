#![allow(unused_variables)]

use crate::{State, permissions::PermissionGroup};
use indexmap::IndexMap;
use serde::Serialize;
use std::{
    ops::{Deref, DerefMut},
    sync::Arc,
};
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

pub mod commands;
pub mod distr;
pub mod manager;

pub struct ExtensionRouteBuilder {
    state: State,
    pub global: Option<Box<OpenApiRouter<State>>>,
    pub api_admin: Option<Box<OpenApiRouter<State>>>,
    pub api_auth: Option<Box<OpenApiRouter<State>>>,
    pub api_client: Option<Box<OpenApiRouter<State>>>,
    pub api_client_servers_server: Option<Box<OpenApiRouter<State>>>,
    pub api_remote: Option<Box<OpenApiRouter<State>>>,
    pub api_remote_servers_server: Option<Box<OpenApiRouter<State>>>,
}

impl ExtensionRouteBuilder {
    pub fn new(state: State) -> Self {
        Self {
            state,
            global: None,
            api_admin: None,
            api_auth: None,
            api_client: None,
            api_client_servers_server: None,
            api_remote: None,
            api_remote_servers_server: None,
        }
    }

    /// Adds a router for handling requests to `/`.
    pub fn add_global_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.global = Some(Box::new(router(self.global.map_or_else(
            || OpenApiRouter::new().with_state(self.state.clone()),
            |b| *b,
        ))));

        self
    }

    /// Adds a router for handling requests to `/api/admin`.
    /// Authentication middleware is already handled by the parent router.
    pub fn add_admin_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_admin = Some(Box::new(router(self.api_admin.map_or_else(
            || OpenApiRouter::new().with_state(self.state.clone()),
            |b| *b,
        ))));

        self
    }

    /// Adds a router for handling requests to `/api/auth`.
    pub fn add_auth_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_auth = Some(Box::new(router(self.api_auth.map_or_else(
            || OpenApiRouter::new().with_state(self.state.clone()),
            |b| *b,
        ))));

        self
    }

    /// Adds a router for handling requests to `/api/client`.
    /// Authentication middleware is already handled by the parent router.
    pub fn add_client_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_client = Some(Box::new(router(self.api_client.map_or_else(
            || OpenApiRouter::new().with_state(self.state.clone()),
            |b| *b,
        ))));

        self
    }

    /// Adds a router for handling requests to `/api/client/servers/{server}`.
    /// Authentication middleware is already handled by the parent router.
    pub fn add_client_server_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_client_servers_server = Some(Box::new(router(
            self.api_client_servers_server.map_or_else(
                || OpenApiRouter::new().with_state(self.state.clone()),
                |b| *b,
            ),
        )));

        self
    }

    /// Adds a router for handling requests to `/api/remote`.
    /// Authentication middleware is already handled by the parent router.
    pub fn add_remote_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_remote = Some(Box::new(router(self.api_remote.map_or_else(
            || OpenApiRouter::new().with_state(self.state.clone()),
            |b| *b,
        ))));

        self
    }

    /// Adds a router for handling requests to `/api/admin`.
    /// Authentication middleware is already handled by the parent router.
    pub fn add_remote_server_api_router(
        mut self,
        router: impl FnOnce(OpenApiRouter<State>) -> OpenApiRouter<State>,
    ) -> Self {
        self.api_remote_servers_server = Some(Box::new(router(
            self.api_remote_servers_server.map_or_else(
                || OpenApiRouter::new().with_state(self.state.clone()),
                |b| *b,
            ),
        )));

        self
    }
}

type RawPermissionMap = IndexMap<&'static str, PermissionGroup>;
pub struct ExtensionPermissionsBuilder {
    pub user_permissions: RawPermissionMap,
    pub admin_permissions: RawPermissionMap,
    pub server_permissions: RawPermissionMap,
}

impl ExtensionPermissionsBuilder {
    pub fn new(
        user_permissions: RawPermissionMap,
        admin_permissions: RawPermissionMap,
        server_permissions: RawPermissionMap,
    ) -> Self {
        Self {
            user_permissions,
            admin_permissions,
            server_permissions,
        }
    }

    /// Adds a permission group to the user permissions.
    pub fn add_user_permission_group(
        mut self,
        group_name: &'static str,
        group: PermissionGroup,
    ) -> Self {
        self.user_permissions.insert(group_name, group);

        self
    }

    /// Adds a permission group to the admin permissions.
    pub fn add_admin_permission_group(
        mut self,
        group_name: &'static str,
        group: PermissionGroup,
    ) -> Self {
        self.admin_permissions.insert(group_name, group);

        self
    }

    /// Adds a permission group to the server permissions.
    pub fn add_server_permission_group(
        mut self,
        group_name: &'static str,
        group: PermissionGroup,
    ) -> Self {
        self.server_permissions.insert(group_name, group);

        self
    }
}

pub type ExtensionCallValue = Box<dyn std::any::Any + Send + Sync>;

#[async_trait::async_trait]
pub trait Extension: Send + Sync {
    /// Your extension entrypoint, this runs as soon as the database is migrated and before the webserver starts
    async fn initialize(&mut self, state: State) {}

    /// Your extension routes entrypoint, this runs as soon as the database is migrated and before the webserver starts
    async fn initialize_router(
        &mut self,
        state: State,
        builder: ExtensionRouteBuilder,
    ) -> ExtensionRouteBuilder {
        builder
    }

    /// Your extension cli entrypoint, this runs after the env has been parsed
    async fn initialize_cli(
        &mut self,
        env: Option<&Arc<crate::env::Env>>,
        builder: commands::CliCommandGroupBuilder,
    ) -> commands::CliCommandGroupBuilder {
        builder
    }

    /// Your extension permissions entrypoint, this runs as soon as the database is migrated and before the webserver starts
    async fn initialize_permissions(
        &mut self,
        state: State,
        builder: ExtensionPermissionsBuilder,
    ) -> ExtensionPermissionsBuilder {
        builder
    }

    /// Your extension call processor, this can be called by other extensions to interact with yours,
    /// if the call does not apply to your extension, simply return `None` to continue the matching process.
    ///
    /// Optimally (if applies) make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
    async fn process_call(
        &self,
        name: &str,
        args: &[ExtensionCallValue],
    ) -> Option<ExtensionCallValue> {
        None
    }

    /// Your extension call processor, this can be called by other extensions to interact with yours,
    /// if the call does not apply to your extension, simply return `None` to continue the matching process.
    ///
    /// The only difference to `process_call` is that this takes an owned vec, its automatically implemented in terms of `process_call`.
    ///
    /// Optimally (if applies) make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
    async fn process_call_owned(
        &self,
        name: &str,
        args: Vec<ExtensionCallValue>,
    ) -> Option<ExtensionCallValue> {
        self.process_call(name, &args).await
    }
}

#[derive(ToSchema, Serialize)]
pub struct ConstructedExtension {
    pub identifier: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub authors: &'static [&'static str],
    #[schema(value_type = String)]
    pub version: semver::Version,

    #[serde(skip)]
    #[schema(ignore)]
    pub extension: Box<dyn Extension>,
}

impl Deref for ConstructedExtension {
    type Target = Box<dyn Extension>;

    fn deref(&self) -> &Self::Target {
        &self.extension
    }
}

impl DerefMut for ConstructedExtension {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.extension
    }
}
