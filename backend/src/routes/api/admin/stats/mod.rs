use super::State;
use utoipa_axum::router::OpenApiRouter;

mod backups;
mod general;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/general", general::router(state))
        .nest("/backups", backups::router(state))
        .with_state(state.clone())
}
