use super::State;
use utoipa_axum::router::OpenApiRouter;

mod _oauth_provider_;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/{oauth_provider}", _oauth_provider_::router(state))
        .with_state(state.clone())
}
