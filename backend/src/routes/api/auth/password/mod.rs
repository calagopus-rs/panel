use super::State;
use utoipa_axum::router::OpenApiRouter;

mod forgot;
mod reset;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/forgot", forgot::router(state))
        .nest("/reset", reset::router(state))
        .with_state(state.clone())
}
