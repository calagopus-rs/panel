use super::State;
use utoipa_axum::router::OpenApiRouter;

mod _user_;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/{user}", _user_::router(state))
        .with_state(state.clone())
}
