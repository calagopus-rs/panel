use axum::http::HeaderMap;
use std::net::IpAddr;
use validator::Validate;

#[inline]
pub fn extract_ip(headers: &HeaderMap) -> Option<IpAddr> {
    let ip = headers
        .get("x-real-ip")
        .or_else(|| headers.get("x-forwarded-for"))
        .map(|ip| ip.to_str().unwrap_or_default())
        .unwrap_or_default();

    if ip.is_empty() {
        return None;
    }

    let ip = if ip.contains(',') {
        ip.split(',').next().unwrap_or_default().trim().to_string()
    } else {
        ip.to_string()
    };

    ip.parse().ok()
}

#[inline]
pub fn slice_up_to(s: &str, max_len: usize) -> &str {
    if max_len >= s.len() {
        return s;
    }

    let mut idx = max_len;
    while !s.is_char_boundary(idx) {
        idx -= 1;
    }

    &s[..idx]
}

#[inline]
pub fn validate_data<T: Validate>(data: &T) -> Result<(), Vec<String>> {
    if let Err(err) = data.validate() {
        let mut errors = Vec::new();
        errors.reserve_exact(err.field_errors().len());

        for (field, field_errors) in err.field_errors() {
            for field_error in field_errors {
                if let Some(message) = &field_error.message {
                    errors.push(format!("{field}: {message}"));
                } else {
                    errors.push(format!("{field}: invalid {}", field_error.code));
                }
            }
        }

        return Err(errors);
    }

    Ok(())
}
