use utoipa_axum::router::OpenApiRouter;

pub mod api;
pub use shared::{GetState, State};

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/api", api::router(state))
        .with_state(state.clone())
}
