use super::State;
use utoipa_axum::router::OpenApiRouter;

mod auto_kill;
mod reinstall;
mod rename;
mod timezone;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/rename", rename::router(state))
        .nest("/reinstall", reinstall::router(state))
        .nest("/timezone", timezone::router(state))
        .nest("/auto-kill", auto_kill::router(state))
        .with_state(state.clone())
}
