use super::State;
use utoipa_axum::router::OpenApiRouter;

mod auto_kill;
mod auto_start;
mod install;
mod rename;
mod timezone;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/rename", rename::router(state))
        .nest("/install", install::router(state))
        .nest("/timezone", timezone::router(state))
        .nest("/auto-kill", auto_kill::router(state))
        .nest("/auto-start", auto_start::router(state))
        .with_state(state.clone())
}
