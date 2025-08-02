use super::State;
use utoipa_axum::router::OpenApiRouter;

mod _server_;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/{server}", _server_::router(state))
        .with_state(state.clone())
}
