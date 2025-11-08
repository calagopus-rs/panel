use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod _oauth_provider_;
mod redirect;

mod get {
    use serde::Serialize;
    use shared::{
        ApiError, GetState,
        models::oauth_provider::{ApiOAuthProvider, OAuthProvider},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response {
        oauth_providers: Vec<ApiOAuthProvider>,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
        (status = NOT_FOUND, body = ApiError),
    ))]
    pub async fn route(state: GetState) -> ApiResponseResult {
        let oauth_providers = OAuthProvider::all_by_usable(&state.database).await?;

        ApiResponse::json(Response {
            oauth_providers: oauth_providers
                .into_iter()
                .map(|oauth_provider| oauth_provider.into_api_object())
                .collect(),
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .nest("/redirect", redirect::router(state))
        .nest("/{oauth_provider}", _oauth_provider_::router(state))
        .with_state(state.clone())
}
