use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    ops::{Deref, DerefMut},
    sync::Arc,
};
use tokio::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MailMode {
    None,
    Smtp {
        host: String,
        port: u16,
        username: Option<String>,
        password: Option<String>,
        use_tls: bool,

        from_address: String,
        from_name: Option<String>,
    },
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CaptchaProvider {
    None,
    Turnstile {
        site_key: String,
        secret_key: String,
    },
    Recaptcha {
        v3: bool,
        site_key: String,
        secret_key: String,
    },
}

impl CaptchaProvider {
    pub fn to_public_provider<'a>(&'a self) -> PublicCaptchaProvider<'a> {
        match &self {
            CaptchaProvider::None => PublicCaptchaProvider::None,
            CaptchaProvider::Turnstile { site_key, .. } => PublicCaptchaProvider::Turnstile {
                site_key: site_key.as_str(),
            },
            CaptchaProvider::Recaptcha { v3, site_key, .. } => PublicCaptchaProvider::Recaptcha {
                v3: *v3,
                site_key: site_key.as_str(),
            },
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PublicCaptchaProvider<'a> {
    None,
    Turnstile { site_key: &'a str },
    Recaptcha { v3: bool, site_key: &'a str },
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AppSettingsApp {
    pub name: String,
    pub icon: Option<String>,
    pub url: String,

    pub telemetry_enabled: bool,
}

impl AppSettingsApp {
    pub fn serialize(&self) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        keys.push("app::name");
        values.push(self.name.clone());
        keys.push("app::icon");
        values.push(self.icon.clone().unwrap_or_default());
        keys.push("app::url");
        values.push(self.url.clone());
        keys.push("app::telemetry_enabled");
        values.push(self.telemetry_enabled.to_string());

        (keys, values)
    }

    pub fn deserialize(map: &mut HashMap<String, String>) -> Self {
        AppSettingsApp {
            name: map
                .remove("app::name")
                .unwrap_or_else(|| "pterodactyl-rs".to_string()),
            icon: map.remove("app::icon").filter(|s| !s.is_empty()),
            url: map
                .remove("app::url")
                .unwrap_or_else(|| "https://example.com".to_string()),
            telemetry_enabled: map
                .remove("app::telemetry_enabled")
                .map(|s| s == "true")
                .unwrap_or(true),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AppSettingsServer {
    pub max_file_manager_view_size: u64,

    pub allow_overwriting_custom_docker_image: bool,
    pub allow_editing_startup_command: bool,
}

impl AppSettingsServer {
    pub fn serialize(&self) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        keys.push("server::max_file_manager_view_size");
        values.push(self.max_file_manager_view_size.to_string());
        keys.push("server::allow_overwriting_custom_docker_image");
        values.push(self.allow_overwriting_custom_docker_image.to_string());
        keys.push("server::allow_editing_startup_command");
        values.push(self.allow_editing_startup_command.to_string());

        (keys, values)
    }

    pub fn deserialize(map: &mut HashMap<String, String>) -> Self {
        AppSettingsServer {
            max_file_manager_view_size: map
                .remove("server::max_file_manager_view_size")
                .and_then(|s| s.parse().ok())
                .unwrap_or(10 * 1024 * 1024),

            allow_overwriting_custom_docker_image: map
                .remove("server::allow_overwriting_custom_docker_image")
                .map(|s| s == "true")
                .unwrap_or(true),
            allow_editing_startup_command: map
                .remove("server::allow_editing_startup_command")
                .map(|s| s == "true")
                .unwrap_or(false),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AppSettings {
    pub mail_mode: MailMode,
    pub captcha_provider: CaptchaProvider,

    #[schema(inline)]
    pub app: AppSettingsApp,
    #[schema(inline)]
    pub server: AppSettingsServer,
}

impl AppSettings {
    pub fn serialize(
        &self,
        database: &crate::database::Database,
    ) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        match &self.mail_mode {
            MailMode::None => {
                keys.push("::mail_mode");
                values.push("none".to_string());
            }
            MailMode::Smtp {
                host,
                port,
                username,
                password,
                use_tls,
                from_address,
                from_name,
            } => {
                keys.push("::mail_mode");
                values.push("smtp".to_string());
                keys.push("::mail_smtp_host");
                values.push(host.clone());
                keys.push("::mail_smtp_port");
                values.push(port.to_string());
                keys.push("::mail_smtp_username");
                values.push(if let Some(username) = username {
                    database
                        .encrypt(username)
                        .map(|b| base32::encode(base32::Alphabet::Z, &b))
                        .unwrap_or_default()
                } else {
                    String::new()
                });
                keys.push("::mail_smtp_password");
                values.push(if let Some(password) = password {
                    database
                        .encrypt(password)
                        .map(|b| base32::encode(base32::Alphabet::Z, &b))
                        .unwrap_or_default()
                } else {
                    String::new()
                });
                keys.push("::mail_smtp_use_tls");
                values.push(use_tls.to_string());
                keys.push("::mail_smtp_from_address");
                values.push(from_address.clone());
                keys.push("::mail_smtp_from_name");
                values.push(from_name.clone().unwrap_or_else(|| "".to_string()));
            }
        }

        match &self.captcha_provider {
            CaptchaProvider::None => {
                keys.push("::captcha_provider");
                values.push("none".to_string());
            }
            CaptchaProvider::Turnstile {
                site_key,
                secret_key,
            } => {
                keys.push("::captcha_provider");
                values.push("turnstile".to_string());
                keys.push("::turnstile_site_key");
                values.push(site_key.clone());
                keys.push("::turnstile_secret_key");
                values.push(secret_key.clone());
            }
            CaptchaProvider::Recaptcha {
                v3,
                site_key,
                secret_key,
            } => {
                keys.push("::captcha_provider");
                values.push("recaptcha".to_string());
                keys.push("::recaptcha_v3");
                values.push(if *v3 { "true" } else { "false" }.to_string());
                keys.push("::recaptcha_site_key");
                values.push(site_key.clone());
                keys.push("::recaptcha_secret_key");
                values.push(secret_key.clone());
            }
        }

        let (keys_app, values_app) = self.app.serialize();
        keys.extend(keys_app);
        values.extend(values_app);
        let (keys_server, values_server) = self.server.serialize();
        keys.extend(keys_server);
        values.extend(values_server);

        (keys, values)
    }

    pub fn deserialize(
        map: &mut HashMap<String, String>,
        database: &crate::database::Database,
    ) -> Self {
        AppSettings {
            mail_mode: match map.remove("::mail_mode").as_deref() {
                Some("none") => MailMode::None,
                Some("smtp") => MailMode::Smtp {
                    host: map
                        .remove("::mail_smtp_host")
                        .unwrap_or_else(|| "smtp.example.com".to_string()),
                    port: map
                        .remove("::mail_smtp_port")
                        .and_then(|s| s.parse().ok())
                        .unwrap_or(587),
                    username: map.remove("::mail_smtp_username").and_then(|s| {
                        if s.is_empty() {
                            None
                        } else {
                            base32::decode(base32::Alphabet::Z, &s)
                                .and_then(|b| database.decrypt(&b))
                        }
                    }),
                    password: map.remove("::mail_smtp_password").and_then(|s| {
                        if s.is_empty() {
                            None
                        } else {
                            base32::decode(base32::Alphabet::Z, &s)
                                .and_then(|b| database.decrypt(&b))
                        }
                    }),
                    use_tls: map
                        .remove("::mail_smtp_use_tls")
                        .map(|s| s == "true")
                        .unwrap_or(true),
                    from_address: map
                        .remove("::mail_smtp_from_address")
                        .unwrap_or_else(|| "noreply@example.com".to_string()),
                    from_name: map
                        .remove("::mail_smtp_from_name")
                        .filter(|s| !s.is_empty()),
                },
                _ => MailMode::None,
            },
            captcha_provider: match map.remove("::captcha_provider").as_deref() {
                Some("none") => CaptchaProvider::None,
                Some("turnstile") => CaptchaProvider::Turnstile {
                    site_key: map
                        .remove("::turnstile_site_key")
                        .unwrap_or_else(|| "your-turnstile-site-key".to_string()),
                    secret_key: map
                        .remove("::turnstile_secret_key")
                        .unwrap_or_else(|| "your-turnstile-secret-key".to_string()),
                },
                Some("recaptcha") => CaptchaProvider::Recaptcha {
                    v3: map
                        .remove("::recaptcha_v3")
                        .map(|s| s == "true")
                        .unwrap_or(false),
                    site_key: map
                        .remove("::recaptcha_site_key")
                        .unwrap_or_else(|| "your-recaptcha-site-key".to_string()),
                    secret_key: map
                        .remove("::recaptcha_secret_key")
                        .unwrap_or_else(|| "your-recaptcha-secret-key".to_string()),
                },
                _ => CaptchaProvider::None,
            },

            app: AppSettingsApp::deserialize(map),
            server: AppSettingsServer::deserialize(map),
        }
    }
}

pub struct SettingsGuard<'a> {
    database: Arc<crate::database::Database>,
    settings: RwLockWriteGuard<'a, AppSettings>,
}

impl<'a> SettingsGuard<'a> {
    pub async fn save(self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let (keys, values) = self.settings.serialize(&self.database);
        drop(self.settings);

        sqlx::query!(
            "INSERT INTO settings (key, value)
            SELECT * FROM UNNEST($1::text[], $2::text[])
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            &keys as &[&str],
            &values
        )
        .execute(self.database.write())
        .await?;

        Ok(())
    }

    pub fn censored(&self) -> serde_json::Value {
        let mut json = serde_json::to_value(&*self.settings).unwrap();

        fn censor_values(key: &str, value: &mut serde_json::Value) {
            match value {
                serde_json::Value::Object(map) => {
                    for (k, v) in map.iter_mut() {
                        censor_values(k, v);
                    }
                }
                serde_json::Value::String(s) => {
                    if key.contains("password") {
                        *s = "*".repeat(s.len());
                    }
                }
                _ => {}
            }
        }

        censor_values("", &mut json);

        json
    }
}

impl Deref for SettingsGuard<'_> {
    type Target = AppSettings;

    fn deref(&self) -> &Self::Target {
        &self.settings
    }
}

impl DerefMut for SettingsGuard<'_> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.settings
    }
}

pub struct Settings {
    cached: RwLock<AppSettings>,
    cached_expires: RwLock<std::time::Instant>,

    database: Arc<crate::database::Database>,
}

impl Settings {
    async fn fetch_setttings(database: &crate::database::Database) -> AppSettings {
        let rows = sqlx::query!("SELECT * FROM settings")
            .fetch_all(database.read())
            .await
            .expect("Failed to fetch settings");

        let mut map = HashMap::new();
        for row in rows {
            map.insert(row.key, row.value);
        }

        AppSettings::deserialize(&mut map, database)
    }

    pub async fn new(database: Arc<crate::database::Database>) -> Self {
        let cached = RwLock::new(Self::fetch_setttings(&database).await);
        let cached_expires =
            RwLock::new(std::time::Instant::now() + std::time::Duration::from_secs(60));

        Self {
            cached,
            cached_expires,
            database,
        }
    }

    pub async fn get(&self) -> RwLockReadGuard<'_, AppSettings> {
        let now = std::time::Instant::now();
        let cached_expires = self.cached_expires.read().await;

        if now >= *cached_expires {
            drop(cached_expires);

            let settings = Self::fetch_setttings(&self.database).await;

            *self.cached.write().await = settings;
            *self.cached_expires.write().await = now + std::time::Duration::from_secs(60);
        }

        self.cached.read().await
    }

    pub async fn get_mut(&self) -> SettingsGuard<'_> {
        let now = std::time::Instant::now();
        let cached_expires = self.cached_expires.read().await;

        if now >= *cached_expires {
            drop(cached_expires);

            let settings = Self::fetch_setttings(&self.database).await;

            *self.cached.write().await = settings;
            *self.cached_expires.write().await = now + std::time::Duration::from_secs(60);
        }

        SettingsGuard {
            database: Arc::clone(&self.database),
            settings: self.cached.write().await,
        }
    }
}
