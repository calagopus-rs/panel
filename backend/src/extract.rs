use axum::{
    extract::{FromRequestParts, OptionalFromRequestParts},
    http::{Extensions, StatusCode, request::Parts},
    response::IntoResponse,
};
use std::{
    convert::Infallible,
    ops::{Deref, DerefMut},
};

pub struct ConsumingExtensionError(String);

impl IntoResponse for ConsumingExtensionError {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::BAD_REQUEST, self.0).into_response()
    }
}

pub struct ConsumingExtension<T>(pub T);

impl<T> ConsumingExtension<T>
where
    T: Send + Sync + 'static,
{
    fn from_extensions(extensions: &mut Extensions) -> Option<Self> {
        extensions.remove::<T>().map(ConsumingExtension)
    }
}

impl<T, S> FromRequestParts<S> for ConsumingExtension<T>
where
    T: Send + Sync + 'static,
    S: Send + Sync,
{
    type Rejection = ConsumingExtensionError;

    async fn from_request_parts(req: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        Self::from_extensions(&mut req.extensions).ok_or_else(|| {
            ConsumingExtensionError(format!(
                "Extension of type `{}` was not found. Perhaps you forgot to add it? See `axum::Extension`.",
                std::any::type_name::<T>()
            ))
        })
    }
}

impl<T, S> OptionalFromRequestParts<S> for ConsumingExtension<T>
where
    T: Send + Sync + 'static,
    S: Send + Sync,
{
    type Rejection = Infallible;

    async fn from_request_parts(
        req: &mut Parts,
        _state: &S,
    ) -> Result<Option<Self>, Self::Rejection> {
        Ok(Self::from_extensions(&mut req.extensions))
    }
}

impl<T> Deref for ConsumingExtension<T>
where
    T: Send + Sync + 'static,
{
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for ConsumingExtension<T>
where
    T: Send + Sync + 'static,
{
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
