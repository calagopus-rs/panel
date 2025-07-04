use super::State;
use utoipa_axum::router::OpenApiRouter;

mod auth;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/auth", auth::router(state))
        .with_state(state.clone())
}
