use super::State;
use utoipa_axum::router::OpenApiRouter;

mod command;
mod docker_image;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/docker-image", docker_image::router(state))
        .nest("/command", command::router(state))
        .with_state(state.clone())
}
