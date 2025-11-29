use super::State;
use utoipa_axum::router::OpenApiRouter;

mod install;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/install", install::router(state))
        .with_state(state.clone())
}
