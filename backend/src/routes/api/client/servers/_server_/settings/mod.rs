use super::State;
use utoipa_axum::router::OpenApiRouter;

mod reinstall;
mod rename;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/rename", rename::router(state))
        .nest("/reinstall", reinstall::router(state))
        .with_state(state.clone())
}
