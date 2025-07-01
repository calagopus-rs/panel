use super::State;
use utoipa_axum::router::OpenApiRouter;

mod login;
mod register;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/login", login::router(state))
        .nest("/register", register::router(state))
        .with_state(state.clone())
}
