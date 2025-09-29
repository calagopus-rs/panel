#![allow(unused_variables)]

use crate::routes::State;
use utoipa_axum::router::OpenApiRouter;

mod list;
pub mod manager;

pub struct ExtensionRouteBuilder {
    state: State,
    api_admin: Option<Box<OpenApiRouter<State>>>,
    api_auth: Option<Box<OpenApiRouter<State>>>,
    api_client: Option<Box<OpenApiRouter<State>>>,
    api_client_servers_server: Option<Box<OpenApiRouter<State>>>,
    api_remote: Option<Box<OpenApiRouter<State>>>,
    api_remote_servers_server: Option<Box<OpenApiRouter<State>>>,
}

impl ExtensionRouteBuilder {
    pub(crate) fn new(state: State) -> Self {
        Self {
            state,
            api_admin: None,
            api_auth: None,
            api_client: None,
            api_client_servers_server: None,
            api_remote: None,
            api_remote_servers_server: None,
        }
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

    /// Your extension call processor, this can be called by other extensions to interact with yours,
    /// if the call does not apply to your extension, simply return `None` to continue the matching process.
    ///
    /// Optimally make sure your calls are globally unique, for example by prepending them with `yourauthorname_yourextensioname_`
    async fn process_call(
        &self,
        name: &str,
        args: &[Box<dyn std::any::Any>],
    ) -> Option<Box<dyn std::any::Any>> {
        None
    }
}
