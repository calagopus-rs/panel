use super::State;
use utoipa_axum::router::OpenApiRouter;

mod contents;
mod download;
mod list;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/list", list::router(state))
        .nest("/contents", contents::router(state))
        .nest("/download", download::router(state))
        .with_state(state.clone())
}
