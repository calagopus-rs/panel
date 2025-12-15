use super::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use axum::{body::Body, extract::Path, http::StatusCode};
    use oauth2::{AuthUrl, ClientId, CsrfToken, RedirectUrl, Scope, basic::BasicClient};
    use rustis::commands::{SetCondition, SetExpiration, StringCommands};
    use shared::{
        ApiError, GetState,
        models::{ByUuid, oauth_provider::OAuthProvider},
        response::{ApiResponse, ApiResponseResult},
    };

    #[utoipa::path(get, path = "/", responses(
        (status = TEMPORARY_REDIRECT, body = String),
        (status = NOT_FOUND, body = ApiError),
    ))]
    pub async fn route(
        state: GetState,
        Path(oauth_provider): Path<uuid::Uuid>,
    ) -> ApiResponseResult {
        let oauth_provider =
            match OAuthProvider::by_uuid_optional_cached(&state.database, oauth_provider).await? {
                Some(oauth_provider) => oauth_provider,
                None => {
                    return ApiResponse::error("oauth provider not found")
                        .with_status(StatusCode::NOT_FOUND)
                        .ok();
                }
            };

        if !oauth_provider.enabled {
            return ApiResponse::error("oauth provider not found")
                .with_status(StatusCode::NOT_FOUND)
                .ok();
        }

        let settings = state.settings.get().await;

        let client = BasicClient::new(ClientId::new(oauth_provider.client_id.to_string()))
            .set_auth_uri(AuthUrl::new(oauth_provider.auth_url.clone())?)
            .set_redirect_uri(RedirectUrl::new(format!(
                "{}/api/auth/oauth/{}",
                settings.app.url.trim_end_matches('/'),
                oauth_provider.uuid
            ))?);

        drop(settings);

        let mut url = client.authorize_url(CsrfToken::new_random);
        for scope in oauth_provider.scopes {
            url = url.add_scope(Scope::new(scope.into()));
        }

        let (authorization_url, csrf_state) = url.url();

        state
            .cache
            .client
            .set_with_options(
                format!("oauth_state::{}", csrf_state.secret()),
                0,
                SetCondition::None,
                SetExpiration::Ex(10 * 60),
                false,
            )
            .await?;

        ApiResponse::new(Body::empty())
            .with_header("Location", authorization_url.as_ref())
            .with_status(StatusCode::TEMPORARY_REDIRECT)
            .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
