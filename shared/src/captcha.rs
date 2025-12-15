use std::sync::{Arc, LazyLock};

static CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .user_agent(format!("github.com/calagopus-rs/panel {}", crate::VERSION))
        .build()
        .expect("Failed to create HTTP client")
});

pub struct Captcha {
    settings: Arc<super::settings::Settings>,
}

impl Captcha {
    pub fn new(settings: Arc<super::settings::Settings>) -> Self {
        Self { settings }
    }

    pub async fn verify(&self, ip: crate::GetIp, captcha: Option<String>) -> Result<(), String> {
        let settings = self.settings.get().await;

        let captcha = match captcha {
            Some(c) => c,
            None => {
                if matches!(
                    settings.captcha_provider,
                    super::settings::CaptchaProvider::None
                ) {
                    return Ok(());
                } else {
                    return Err("captcha: required".to_string());
                }
            }
        };

        match &settings.captcha_provider {
            super::settings::CaptchaProvider::None => Ok(()),
            super::settings::CaptchaProvider::Turnstile { secret_key, .. } => {
                let response = CLIENT
                    .post("https://challenges.cloudflare.com/turnstile/v0/siteverify")
                    .json(&serde_json::json!({
                        "secret": secret_key,
                        "response": captcha,
                        "remoteip": ip.to_string(),
                    }))
                    .send()
                    .await
                    .map_err(|e| e.to_string())?;

                if response.status().is_success() {
                    let body: serde_json::Value =
                        response.json().await.map_err(|e| e.to_string())?;
                    if let Some(success) = body.get("success")
                        && success.as_bool().unwrap_or(false)
                    {
                        return Ok(());
                    }
                }

                Err("captcha: verification failed".to_string())
            }
            super::settings::CaptchaProvider::Recaptcha { v3, secret_key, .. } => {
                let response = CLIENT
                    .get("https://www.google.com/recaptcha/api/siteverify")
                    .query(&[
                        ("secret", secret_key.as_str()),
                        ("response", captcha.as_str()),
                        ("remoteip", ip.to_string().as_str()),
                    ])
                    .send()
                    .await
                    .map_err(|e| e.to_string())?;

                if response.status().is_success() {
                    let body: serde_json::Value =
                        response.json().await.map_err(|e| e.to_string())?;
                    if let Some(success) = body.get("success")
                        && success.as_bool().unwrap_or(false)
                    {
                        if *v3 {
                            if let Some(score) = body.get("score")
                                && score.as_f64().unwrap_or(0.0) >= 0.5
                            {
                                return Ok(());
                            }
                        } else {
                            return Ok(());
                        }
                    }
                }

                Err("captcha: verification failed".to_string())
            }
        }
    }
}
