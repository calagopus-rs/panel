use crate::{cap::CapFilesystem, prelude::AsyncOptionExtension};
use futures_util::FutureExt;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    ops::{Deref, DerefMut},
    path::PathBuf,
    sync::Arc,
};
use tokio::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StorageDriver {
    Filesystem {
        path: String,
    },
    S3 {
        public_url: String,
        access_key: String,
        secret_key: String,
        bucket: String,
        region: String,
        endpoint: String,
        path_style: bool,
    },
}

impl StorageDriver {
    pub async fn get_cap_filesystem(&self) -> Option<Result<CapFilesystem, std::io::Error>> {
        match self {
            StorageDriver::Filesystem { path } => {
                Some(CapFilesystem::new(PathBuf::from(path)).await)
            }
            _ => None,
        }
    }
}

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
    Sendmail {
        command: String,

        from_address: String,
        from_name: Option<String>,
    },
    Filesystem {
        path: String,

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
    pub url: String,

    pub telemetry_enabled: bool,
    pub registration_enabled: bool,
}

impl AppSettingsApp {
    pub fn serialize(&self) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        keys.push("app::name");
        values.push(self.name.clone());
        keys.push("app::url");
        values.push(self.url.clone());
        keys.push("app::telemetry_enabled");
        values.push(self.telemetry_enabled.to_string());
        keys.push("app::registration_enabled");
        values.push(self.registration_enabled.to_string());

        (keys, values)
    }

    pub fn deserialize(map: &mut HashMap<String, String>) -> Self {
        AppSettingsApp {
            name: map
                .remove("app::name")
                .unwrap_or_else(|| "Calagopus".to_string()),
            url: map
                .remove("app::url")
                .unwrap_or_else(|| "http://localhost:8000".to_string()),
            telemetry_enabled: map
                .remove("app::telemetry_enabled")
                .map(|s| s == "true")
                .unwrap_or(true),
            registration_enabled: map
                .remove("app::registration_enabled")
                .map(|s| s == "true")
                .unwrap_or(true),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AppSettingsWebauthn {
    pub rp_id: String,
    pub rp_origin: String,
}

impl AppSettingsWebauthn {
    pub fn serialize(&self) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        keys.push("webauthn::rp_id");
        values.push(self.rp_id.clone());
        keys.push("webauthn::rp_origin");
        values.push(self.rp_origin.clone());

        (keys, values)
    }

    pub fn deserialize(map: &mut HashMap<String, String>) -> Self {
        AppSettingsWebauthn {
            rp_id: map
                .remove("webauthn::rp_id")
                .unwrap_or_else(|| "localhost".to_string()),
            rp_origin: map
                .remove("webauthn::rp_origin")
                .unwrap_or_else(|| "http://localhost".to_string()),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AppSettingsServer {
    pub max_file_manager_view_size: u64,
    pub max_schedules_step_count: u64,

    pub allow_overwriting_custom_docker_image: bool,
    pub allow_editing_startup_command: bool,
}

impl AppSettingsServer {
    pub fn serialize(&self) -> (Vec<&'static str>, Vec<String>) {
        let mut keys = Vec::new();
        let mut values = Vec::new();

        keys.push("server::max_file_manager_view_size");
        values.push(self.max_file_manager_view_size.to_string());
        keys.push("server::max_schedules_step_count");
        values.push(self.max_schedules_step_count.to_string());
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
            max_schedules_step_count: map
                .remove("server::max_schedules_step_count")
                .and_then(|s| s.parse().ok())
                .unwrap_or(100),

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
    pub oobe_step: Option<String>,

    pub storage_driver: StorageDriver,
    pub mail_mode: MailMode,
    pub captcha_provider: CaptchaProvider,

    #[schema(inline)]
    pub app: AppSettingsApp,
    #[schema(inline)]
    pub webauthn: AppSettingsWebauthn,
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

        keys.push("::oobe_step");
        values.push(self.oobe_step.clone().unwrap_or_else(|| "".to_string()));

        match &self.storage_driver {
            StorageDriver::Filesystem { path } => {
                keys.push("::storage_driver");
                values.push("filesystem".to_string());
                keys.push("::storage_filesystem_path");
                values.push(path.clone());
            }
            StorageDriver::S3 {
                public_url,
                access_key,
                secret_key,
                bucket,
                region,
                endpoint,
                path_style,
            } => {
                keys.push("::storage_driver");
                values.push("s3".to_string());
                keys.push("::storage_s3_public_url");
                values.push(public_url.clone());
                keys.push("::storage_s3_access_key");
                values.push(
                    database
                        .encrypt_sync(access_key)
                        .map(|b| base32::encode(base32::Alphabet::Z, &b))
                        .unwrap_or_default(),
                );
                keys.push("::storage_s3_secret_key");
                values.push(
                    database
                        .encrypt_sync(secret_key)
                        .map(|b| base32::encode(base32::Alphabet::Z, &b))
                        .unwrap_or_default(),
                );
                keys.push("::storage_s3_bucket");
                values.push(bucket.clone());
                keys.push("::storage_s3_region");
                values.push(region.clone());
                keys.push("::storage_s3_endpoint");
                values.push(endpoint.clone());
                keys.push("::storage_s3_path_style");
                values.push(path_style.to_string());
            }
        }

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
                        .encrypt_sync(username)
                        .map(|b| base32::encode(base32::Alphabet::Z, &b))
                        .unwrap_or_default()
                } else {
                    String::new()
                });
                keys.push("::mail_smtp_password");
                values.push(if let Some(password) = password {
                    database
                        .encrypt_sync(password)
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
            MailMode::Sendmail {
                command,
                from_address,
                from_name,
            } => {
                keys.push("::mail_mode");
                values.push("sendmail".to_string());
                keys.push("::mail_sendmail_command");
                values.push(command.clone());
                keys.push("::mail_sendmail_from_address");
                values.push(from_address.clone());
                keys.push("::mail_sendmail_from_name");
                values.push(from_name.clone().unwrap_or_else(|| "".to_string()));
            }
            MailMode::Filesystem {
                path,
                from_address,
                from_name,
            } => {
                keys.push("::mail_mode");
                values.push("filesystem".to_string());
                keys.push("::mail_filesystem_path");
                values.push(path.clone());
                keys.push("::mail_filesystem_from_address");
                values.push(from_address.clone());
                keys.push("::mail_filesystem_from_name");
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
        let (keys_webauthn, values_webauthn) = self.webauthn.serialize();
        keys.extend(keys_webauthn);
        values.extend(values_webauthn);
        let (keys_server, values_server) = self.server.serialize();
        keys.extend(keys_server);
        values.extend(values_server);

        (keys, values)
    }

    pub async fn deserialize(
        map: &mut HashMap<String, String>,
        database: &crate::database::Database,
    ) -> Self {
        AppSettings {
            oobe_step: match map.remove("::oobe_step") {
                Some(step) if step.is_empty() => None,
                Some(step) => Some(step),
                None => {
                    if crate::models::user::User::count(database).await > 0 {
                        None
                    } else {
                        Some("register".into())
                    }
                }
            },
            storage_driver: match map.remove("::storage_driver").as_deref() {
                Some("filesystem") => StorageDriver::Filesystem {
                    path: map.remove("::storage_filesystem_path").unwrap_or_else(|| {
                        if std::env::consts::OS == "windows" {
                            "C:\\calagopus_data".to_string()
                        } else {
                            "/var/lib/calagopus".to_string()
                        }
                    }),
                },
                Some("s3") => StorageDriver::S3 {
                    public_url: map
                        .remove("::storage_s3_public_url")
                        .unwrap_or_else(|| "https://your-s3-bucket.s3.amazonaws.com".to_string()),
                    access_key: match map.remove("::storage_s3_access_key") {
                        Some(access_key) => base32::decode(base32::Alphabet::Z, &access_key)
                            .map(|b| database.decrypt(b).map(Result::ok))
                            .awaited()
                            .await
                            .flatten(),
                        None => None,
                    }
                    .unwrap_or_else(|| "your-access-key".into()),
                    secret_key: match map.remove("::storage_s3_secret_key") {
                        Some(secret_key) => base32::decode(base32::Alphabet::Z, &secret_key)
                            .map(|b| database.decrypt(b).map(Result::ok))
                            .awaited()
                            .await
                            .flatten(),
                        None => None,
                    }
                    .unwrap_or_else(|| "your-secret-key".into()),
                    bucket: map
                        .remove("::storage_s3_bucket")
                        .unwrap_or_else(|| "your-s3-bucket".to_string()),
                    region: map
                        .remove("::storage_s3_region")
                        .unwrap_or_else(|| "us-east-1".to_string()),
                    endpoint: map
                        .remove("::storage_s3_endpoint")
                        .unwrap_or_else(|| "https://s3.amazonaws.com".to_string()),
                    path_style: map
                        .remove("::storage_s3_path_style")
                        .map(|s| s == "true")
                        .unwrap_or(false),
                },
                _ => StorageDriver::Filesystem {
                    path: map.remove("::storage_filesystem_path").unwrap_or_else(|| {
                        if std::env::consts::OS == "windows" {
                            "C:\\calagopus_data".to_string()
                        } else {
                            "/var/lib/calagopus".to_string()
                        }
                    }),
                },
            },
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
                    username: match map.remove("::mail_smtp_username") {
                        Some(username) => {
                            if username.is_empty() {
                                None
                            } else {
                                base32::decode(base32::Alphabet::Z, &username)
                                    .map(|b| database.decrypt(b).map(Result::ok))
                                    .awaited()
                                    .await
                                    .flatten()
                            }
                        }
                        None => None,
                    },
                    password: match map.remove("::mail_smtp_password") {
                        Some(username) => {
                            if username.is_empty() {
                                None
                            } else {
                                base32::decode(base32::Alphabet::Z, &username)
                                    .map(|b| database.decrypt(b).map(Result::ok))
                                    .awaited()
                                    .await
                                    .flatten()
                            }
                        }
                        None => None,
                    },
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
                Some("sendmail") => MailMode::Sendmail {
                    command: map
                        .remove("::mail_sendmail_command")
                        .unwrap_or_else(|| "sendmail".to_string()),
                    from_address: map
                        .remove("::mail_sendmail_from_address")
                        .unwrap_or_else(|| "noreply@example.com".to_string()),
                    from_name: map
                        .remove("::mail_sendmail_from_name")
                        .filter(|s| !s.is_empty()),
                },
                Some("filesystem") => MailMode::Filesystem {
                    path: map
                        .remove("::mail_filesystem_path")
                        .unwrap_or_else(|| "/var/lib/calagopus/mails".to_string()),
                    from_address: map
                        .remove("::mail_filesystem_from_address")
                        .unwrap_or_else(|| "noreply@example.com".to_string()),
                    from_name: map
                        .remove("::mail_filesystem_from_name")
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
            webauthn: AppSettingsWebauthn::deserialize(map),
            server: AppSettingsServer::deserialize(map),
        }
    }
}

pub struct SettingsGuard<'a> {
    database: Arc<crate::database::Database>,
    settings: RwLockWriteGuard<'a, AppSettings>,
}

impl<'a> SettingsGuard<'a> {
    pub async fn save(self) -> Result<(), crate::database::DatabaseError> {
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

        AppSettings::deserialize(&mut map, database).await
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

    pub async fn get_webauthn(&self) -> Result<webauthn_rs::Webauthn, anyhow::Error> {
        let settings = self.get().await;

        Ok(webauthn_rs::WebauthnBuilder::new(
            &settings.webauthn.rp_id,
            &settings.webauthn.rp_origin.parse()?,
        )?
        .rp_name(&settings.app.name)
        .build()?)
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
