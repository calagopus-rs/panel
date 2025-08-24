use super::State;
use utoipa_axum::router::OpenApiRouter;

mod _operation_;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/{operation}", _operation_::router(state))
        .with_state(state.clone())
}
