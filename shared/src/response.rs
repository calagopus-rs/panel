use crate::ApiError;
use axum::response::IntoResponse;

pub type ApiResponseResult = Result<ApiResponse, ApiResponse>;

pub struct ApiResponse {
    pub body: axum::body::Body,
    pub status: axum::http::StatusCode,
    pub headers: axum::http::HeaderMap,
}

impl ApiResponse {
    #[inline]
    pub fn new(body: axum::body::Body) -> Self {
        Self {
            body,
            status: axum::http::StatusCode::OK,
            headers: axum::http::HeaderMap::new(),
        }
    }

    #[inline]
    pub fn json(body: impl serde::Serialize) -> Self {
        Self {
            body: axum::body::Body::from(serde_json::to_vec(&body).unwrap()),
            status: axum::http::StatusCode::OK,
            headers: axum::http::HeaderMap::from_iter([(
                axum::http::header::CONTENT_TYPE,
                axum::http::HeaderValue::from_static("application/json"),
            )]),
        }
    }

    #[inline]
    pub fn error(err: &str) -> Self {
        Self::json(ApiError::new_value(&[err])).with_status(axum::http::StatusCode::BAD_REQUEST)
    }

    #[inline]
    pub fn with_status(mut self, status: axum::http::StatusCode) -> Self {
        self.status = status;
        self
    }

    #[inline]
    pub fn with_header(mut self, key: &'static str, value: &str) -> Self {
        if let Ok(header_value) = axum::http::HeaderValue::from_str(value) {
            self.headers.insert(key, header_value);
        }

        self
    }

    #[inline]
    pub fn ok(self) -> ApiResponseResult {
        Ok(self)
    }
}

impl<T> From<T> for ApiResponse
where
    T: Into<anyhow::Error>,
{
    #[inline]
    fn from(err: T) -> Self {
        let err: anyhow::Error = err.into();

        tracing::error!("a request error occurred: {:#?}", err);
        sentry_anyhow::capture_anyhow(&err);

        ApiResponse::json(ApiError::new_value(&["internal server error"]))
            .with_status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
    }
}

impl IntoResponse for ApiResponse {
    #[inline]
    fn into_response(self) -> axum::response::Response {
        let mut response = axum::http::Response::new(self.body);
        *response.status_mut() = self.status;
        *response.headers_mut() = self.headers;

        response
    }
}
