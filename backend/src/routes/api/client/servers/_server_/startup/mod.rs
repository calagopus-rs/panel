use super::State;
use utoipa_axum::router::OpenApiRouter;

mod command;
mod docker_image;
mod variables;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/variables", variables::router(state))
        .nest("/docker-image", docker_image::router(state))
        .nest("/command", command::router(state))
        .with_state(state.clone())
}
