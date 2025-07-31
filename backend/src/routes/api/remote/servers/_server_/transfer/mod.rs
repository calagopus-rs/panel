use super::State;
use utoipa_axum::router::OpenApiRouter;

mod failure;
mod success;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/success", success::router(state))
        .nest("/failure", failure::router(state))
        .with_state(state.clone())
}
