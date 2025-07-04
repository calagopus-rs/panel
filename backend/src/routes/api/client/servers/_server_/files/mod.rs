use super::State;
use utoipa_axum::router::OpenApiRouter;

mod chmod;
mod compress;
mod contents;
mod copy;
mod create_folder;
mod decompress;
mod delete;
mod download;
mod list;
mod pulls;
mod rename;
mod upload;
mod write;

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .nest("/list", list::router(state))
        .nest("/contents", contents::router(state))
        .nest("/download", download::router(state))
        .nest("/upload", upload::router(state))
        .nest("/rename", rename::router(state))
        .nest("/copy", copy::router(state))
        .nest("/write", write::router(state))
        .nest("/compress", compress::router(state))
        .nest("/decompress", decompress::router(state))
        .nest("/delete", delete::router(state))
        .nest("/create-folder", create_folder::router(state))
        .nest("/chmod", chmod::router(state))
        .nest("/pulls", pulls::router(state))
        .with_state(state.clone())
}
