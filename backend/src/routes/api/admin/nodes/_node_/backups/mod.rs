use super::State;
use utoipa_axum::router::OpenApiRouter;

mod _backup_;
mod detached;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/detached", detached::router(state))
        .nest("/{backup}", _backup_::router(state))
        .with_state(state.clone())
}
