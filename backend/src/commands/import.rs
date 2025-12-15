use base64::Engine;
use clap::{Args, FromArgMatches};
use colored::Colorize;
use compact_str::ToCompactString;
use openssl::symm::Cipher;
use serde::Deserialize;
use sqlx::Row;
use std::{
    collections::{HashMap, HashSet},
    str::FromStr,
    sync::Arc,
};

static BASE64_ENGINE: base64::engine::general_purpose::GeneralPurpose =
    base64::engine::general_purpose::GeneralPurpose::new(
        &base64::alphabet::STANDARD,
        base64::engine::general_purpose::GeneralPurposeConfig::new(),
    );

#[derive(Args)]
pub struct ImportArgs {
    #[arg(
        short = 'e',
        long = "environment",
        help = "the environment variable file location for the pterodactyl panel",
        default_value = "/var/www/pterodactyl/.env"
    )]
    environment: String,
}

pub struct ImportCommand;

impl shared::extensions::commands::CliCommand<ImportArgs> for ImportCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|env, arg_matches| {
            Box::pin(async move {
                let args = ImportArgs::from_arg_matches(&arg_matches)?;

                let env = match env {
                    Some(env) => env,
                    None => {
                        eprintln!(
                            "{}",
                            "please setup the new panel environment before importing.".red()
                        );

                        std::process::exit(1);
                    }
                };

                if let Err(err) = dotenvy::from_path(args.environment) {
                    eprintln!(
                        "{}: {:#?}",
                        "failed to read pterodactyl environment file".red(),
                        err
                    );

                    std::process::exit(1);
                }

                let source_app_url = match std::env::var("APP_URL") {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment APP_URL".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_app_key = match std::env::var("APP_KEY")
                    .map(|v| BASE64_ENGINE.decode(v.trim_start_matches("base64:")))
                {
                    Ok(Ok(value)) => Arc::new(value),
                    Ok(Err(err)) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment APP_KEY".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment APP_KEY".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_database_host = match std::env::var("DB_HOST") {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_HOST".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_database_port = match std::env::var("DB_PORT").map(|v| v.parse::<u16>())
                {
                    Ok(Ok(value)) => value,
                    Ok(Err(err)) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_PORT".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_PORT".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_database_database = match std::env::var("DB_DATABASE") {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_DATABASE".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_database_username = match std::env::var("DB_USERNAME") {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_USERNAME".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };
                let source_database_password = match std::env::var("DB_PASSWORD") {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to read pterodactyl environment DB_PASSWORD".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };

                let source_database = sqlx::mysql::MySqlConnectOptions::new()
                    .host(source_database_host.trim_matches('"'))
                    .port(source_database_port)
                    .database(source_database_database.trim_matches('"'))
                    .username(source_database_username.trim_matches('"'))
                    .password(source_database_password.trim_matches('"'));
                let source_database = match sqlx::mysql::MySqlPoolOptions::new()
                    .connect_with(source_database)
                    .await
                {
                    Ok(database) => database,
                    Err(err) => {
                        eprintln!(
                            "{}: {:#?}",
                            "failed to connect to pterodactyl database".red(),
                            err
                        );

                        std::process::exit(1);
                    }
                };

                let cache = Arc::new(shared::cache::Cache::new(&env).await);
                let database = Arc::new(shared::database::Database::new(&env, cache.clone()).await);
                let settings = Arc::new(shared::settings::Settings::new(database.clone()).await);

                if let Err(err) = process_table(
                    &source_database,
                    "settings",
                    None,
                    async |rows| {
                        let mut settings = settings.get_mut().await;

                        let mut source_settings: HashMap<&str, compact_str::CompactString> = rows
                            .iter()
                            .map(|r| (r.get("key"), r.get("value")))
                            .collect();

                        settings.oobe_step = None;
                        settings.app.url = source_app_url.to_compact_string();
                        if let Some(app_name) = source_settings.remove("settings::app:name") {
                            settings.app.name = app_name;
                        }

                        if let Some(smtp_host) =
                            source_settings.remove("settings::mail:mailers:smtp:host")
                            && let Some(Ok(smtp_port)) = source_settings
                                .remove("settings::mail:mailers:smtp:port")
                                .map(|p| p.parse::<u16>())
                            && let Some(from_address) =
                                source_settings.remove("settings::mail:from:address")
                        {
                            settings.mail_mode = shared::settings::MailMode::Smtp {
                                host: smtp_host,
                                port: smtp_port,
                                username: source_settings
                                    .remove("settings::mail:mailers:smtp:username"),
                                password: source_settings
                                    .remove("settings::mail:mailers:smtp:password")
                                    .and_then(|p| decrypt_laravel_value(&p, &source_app_key).ok()),
                                use_tls: source_settings
                                    .remove("settings::mail:mailers:smtp:encryption")
                                    .is_some_and(|e| e == "tls"),
                                from_address,
                                from_name: source_settings.remove("settings::mail:from:name"),
                            };
                        }

                        settings.save().await?;

                        Ok(())
                    },
                    100000,
                )
                .await
                {
                    tracing::error!("failed to process settings table: {:?}", err);
                    std::process::exit(1);
                }

                let user_mappings = match process_table(
                    &source_database,
                    "users",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;

                            mapping.insert(id, *uuid.as_uuid());

                            let source_app_key = source_app_key.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let external_id: Option<&str> = row.try_get("external_id")?;
                                let username: &str = row.try_get("username")?;
                                let email: &str = row.try_get("email")?;
                                let name_first: &str = row.try_get("name_first")?;
                                let name_last: &str = row.try_get("name_last")?;
                                let password: &str = row.try_get("password")?;
                                let admin: bool = row.try_get("root_admin")?;
                                let totp_enabled: bool = row.try_get("use_totp")?;
                                let totp_secret: Option<compact_str::CompactString> = row.try_get::<Option<&str>, _>("totp_secret")?
                                    .and_then(|s| decrypt_laravel_value(s, &source_app_key).ok());
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                sqlx::query(
                                    r#"
                                    INSERT INTO users (uuid, external_id, username, email, name_first, name_last, password, admin, totp_enabled, totp_secret, created)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                    ON CONFLICT DO NOTHING
                                    "#
                                )
                                .bind(uuid.as_uuid())
                                .bind(external_id)
                                .bind(username)
                                .bind(email)
                                .bind(name_first)
                                .bind(name_last)
                                .bind(password.replace("$2y$", "$2a$"))
                                .bind(admin)
                                .bind(totp_enabled)
                                .bind(totp_secret)
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(mapping)
                    },
                    64,
                )
                .await
                {
                    Ok(user_mappings) => Arc::new(user_mappings),
                    Err(err) => {
                        tracing::error!("failed to process users table: {:?}", err);
                        std::process::exit(1);
                    }
                };

                if let Err(err) = process_table(
                    &source_database,
                    "user_ssh_keys",
                    Some("deleted_at IS NULL"),
                    async |rows| {
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let user_mappings = user_mappings.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let user_id: u32 = row.try_get("user_id")?;
                                let name: &str = row.try_get("name")?;
                                let public_key: &str = row.try_get("public_key")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                let user_uuid = match user_mappings.iter().find(|m| m.contains_key(&user_id)) {
                                    Some(user_uuid) => user_uuid.get(&user_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let base64_data = public_key
                                    .replace("-----BEGIN PUBLIC KEY-----", "")
                                    .replace("-----END PUBLIC KEY-----", "")
                                    .replace("\r\n", "");
                                let base64_data = BASE64_ENGINE.decode(base64_data)?;

                                let pkey = openssl::pkey::PKey::public_key_from_der(&base64_data)?;
                                let public_key = russh::keys::PublicKey::from(match pkey.id() {
                                    openssl::pkey::Id::RSA => {
                                        let rsa = pkey.rsa()?;

                                        russh::keys::ssh_key::public::KeyData::Rsa(
                                            russh::keys::ssh_key::public::RsaPublicKey {
                                                e: rsa.e().to_vec().as_slice().try_into()?,
                                                n: rsa.n().to_vec().as_slice().try_into()?,
                                            },
                                        )
                                    }
                                    openssl::pkey::Id::ED25519 => {
                                        let data = pkey.raw_public_key()?;

                                        russh::keys::ssh_key::public::KeyData::Ed25519(
                                            russh::keys::ssh_key::public::Ed25519PublicKey(
                                                data.try_into().map_err(|_| {
                                                    anyhow::anyhow!("invalid ed25519 public key length")
                                                })?,
                                            ),
                                        )
                                    }
                                    _ => return Ok(()),
                                });

                                sqlx::query(
                                    r#"
                                    INSERT INTO user_ssh_keys (user_uuid, name, fingerprint, public_key, created)
                                    VALUES ($1, $2, $3, $4, $5)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(user_uuid)
                                .bind(name)
                                .bind(
                                    public_key
                                        .fingerprint(russh::keys::HashAlg::Sha256)
                                        .to_string(),
                                )
                                .bind(public_key.to_bytes().unwrap())
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(())
                    },
                    64,
                )
                .await
                {
                    tracing::error!("failed to process ssh keys table: {:?}", err);
                    std::process::exit(1);
                }
                /*if let Err(err) = process_table(
                    &source_database,
                    "api_keys",
                    Some("user_id IS NOT NULL AND key_type = 1"),
                    async |rows| {
                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let user_id: u32 = row.try_get("user_id")?;
                            let name = format!("imported-{}", id);
                            let token: &str = row.try_get("token")?;
                            let last_used: Option<chrono::DateTime<chrono::Utc>> = row.try_get("last_used_at")?;
                            let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                            let user_uuid = match user_mappings.iter().find(|m| m.contains_key(&user_id)) {
                                Some(user_uuid) => user_uuid.get(&user_id).unwrap(),
                                None => continue,
                            };

                            let token = match decrypt_laravel_value(token, &source_app_key) {
                                Ok(token) => token,
                                Err(_) => continue,
                            };

                            println!("importing api key for user {}", token);

                            sqlx::query(
                                r#"
                                INSERT INTO user_api_keys (user_uuid, name, key_start, key, last_used, created)
                                VALUES ($1, $2, $3, crypt($4, gen_salt('xdes', 321)), $5, $6)
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(user_uuid)
                            .bind(name)
                            .bind(last_used)
                            .bind(created)
                            .execute(database.write())
                            .await?;
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process table: {:?}", err);
                    std::process::exit(1);
                }*/

                let backup_configuration_uuid: uuid::Uuid = {
                    let row = sqlx::query(
                        r#"
                        INSERT INTO backup_configurations (name, description, backup_disk, backup_configs)
                        VALUES ($1, $2, $3, $4)
                        RETURNING uuid
                        "#,
                    )
                    .bind("global")
                    .bind("automatically generated by import")
                    .bind(shared::models::server_backup::BackupDisk::Local)
                    .bind(
                        serde_json::to_value(
                            shared::models::backup_configurations::BackupConfigs::default(),
                        )
                        .unwrap(),
                    )
                    .fetch_one(database.write())
                    .await
                    .unwrap();

                    row.get("uuid")
                };

                let location_mappings = match process_table(
                    &source_database,
                    "locations",
                    None,
                    async |rows| {
                        let mut mapping: HashMap<u32, uuid::Uuid> =
                            HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let short_name: &str = row.try_get("short")?;
                            let description: Option<&str> = row.try_get("long")?;
                            let created: chrono::DateTime<chrono::Utc> =
                                row.try_get("created_at")?;

                            let row = sqlx::query(
                                r#"
                                INSERT INTO locations (backup_configuration_uuid, name, description, created)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                                RETURNING uuid
                                "#,
                            )
                            .bind(backup_configuration_uuid)
                            .bind(short_name)
                            .bind(description)
                            .bind(created)
                            .fetch_one(database.write())
                            .await?;

                            mapping.insert(id, row.get("uuid"));
                        }

                        Ok(mapping)
                    },
                    128,
                )
                .await
                {
                    Ok(location_mappings) => Arc::new(location_mappings),
                    Err(err) => {
                        tracing::error!("failed to process locations table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                let node_mappings = match process_table(
                    &source_database,
                    "nodes",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;

                            mapping.insert(id, *uuid.as_uuid());

                            let source_app_key = source_app_key.clone();
                            let location_mappings = location_mappings.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let public: bool = row.try_get("public")?;
                                let name: &str = row.try_get("name")?;
                                let description: Option<&str> = row.try_get("description")?;
                                let location_id: u32 = row.try_get("location_id")?;
                                let fqdn: &str = row.try_get("fqdn")?;
                                let scheme: &str = row.try_get("scheme")?;
                                let memory: u64 = row.try_get("memory")?;
                                let disk: u64 = row.try_get("disk")?;
                                let token_id: &str = row.try_get("daemon_token_id")?;
                                let token: &str = row.try_get("daemon_token")?;
                                let daemon_listen: u16 = row.try_get("daemonListen")?;
                                let daemon_sftp: u16 = row.try_get("daemonSFTP")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                let location_uuid = match location_mappings.iter().find(|m| m.contains_key(&location_id)) {
                                    Some(location_uuid) => location_uuid.get(&location_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let token = match decrypt_laravel_value(token, &source_app_key) {
                                    Ok(token) => token,
                                    Err(_) => return Ok(()),
                                };

                                let url: reqwest::Url = match format!("{}://{}:{}", scheme, fqdn, daemon_listen).parse() {
                                    Ok(url) => url,
                                    Err(_) => return Ok(()),
                                };

                                sqlx::query(
                                    r#"
                                    INSERT INTO nodes (uuid, public, name, description, location_uuid, url, sftp_port, memory, disk, token_id, token, created)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                                    ON CONFLICT DO NOTHING
                                    "#
                                )
                                .bind(uuid.as_uuid())
                                .bind(public)
                                .bind(name)
                                .bind(description)
                                .bind(location_uuid)
                                .bind(url.to_string())
                                .bind(daemon_sftp as i32)
                                .bind(memory as i64)
                                .bind(disk as i64)
                                .bind(token_id)
                                .bind(database.encrypt(token).await.unwrap())
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(mapping)
                    },
                    64,
                )
                .await
                {
                    Ok(node_mappings) => node_mappings,
                    Err(err) => {
                        tracing::error!("failed to process nodes table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                drop(location_mappings);

                let nest_mappings = match process_table(
                    &source_database,
                    "nests",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;
                            let author: &str = row.try_get("author")?;
                            let name: &str = row.try_get("name")?;
                            let description: Option<&str> = row.try_get("description")?;
                            let created: chrono::DateTime<chrono::Utc> =
                                row.try_get("created_at")?;

                            sqlx::query(
                                r#"
                                INSERT INTO nests (uuid, author, name, description, created)
                                VALUES ($1, $2, $3, $4, $5)
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(uuid.as_uuid())
                            .bind(author)
                            .bind(name)
                            .bind(description)
                            .bind(created)
                            .execute(database.write())
                            .await?;

                            mapping.insert(id, *uuid.as_uuid());
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(nest_mappings) => nest_mappings,
                    Err(err) => {
                        tracing::error!("failed to process nests table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                let egg_mappings = match process_table(
                    &source_database,
                    "eggs",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;
                            let nest_id: u32 = row.try_get("nest_id")?;
                            let author: &str = row.try_get("author")?;
                            let name: &str = row.try_get("name")?;
                            let description: Option<&str> = row.try_get("description")?;
                            let features: Option<serde_json::Value> = row.try_get("features")?;
                            let docker_images: serde_json::Value = row.try_get("docker_images")?;
                            let file_denylist: Option<serde_json::Value> =
                                row.try_get("file_denylist")?;
                            let config_files: Option<serde_json::Value> =
                                row.try_get("config_files")?;
                            let config_startup: Option<serde_json::Value> =
                                row.try_get("config_startup")?;
                            let config_stop: Option<compact_str::CompactString> = row.try_get("config_stop")?;
                            let config_script = shared::models::nest_egg::NestEggConfigScript {
                                container: row.try_get("script_container")?,
                                entrypoint: row.try_get("script_entry")?,
                                content: row.try_get("script_install")?,
                            };
                            let startup: &str = row.try_get("startup")?;
                            let force_outgoing_ip: bool = row.try_get("force_outgoing_ip")?;
                            let created: chrono::DateTime<chrono::Utc> =
                                row.try_get("created_at")?;

                            let nest_uuid =
                                match nest_mappings.iter().find(|m| m.contains_key(&nest_id)) {
                                    Some(nest_uuid) => nest_uuid.get(&nest_id).unwrap(),
                                    None => continue,
                                };

                            let features: Vec<String> = serde_json::from_value(
                                features.unwrap_or_else(|| serde_json::Value::Array(vec![])),
                            )
                            .unwrap_or_default();
                            let file_denylist: Vec<String> = serde_json::from_value(
                                file_denylist.unwrap_or_else(|| serde_json::Value::Array(vec![])),
                            )
                            .unwrap_or_default();

                            let config_files: Vec<
                                shared::models::nest_egg::ProcessConfigurationFile,
                            > = serde_json::from_value(config_files.unwrap_or_default())
                                .unwrap_or_default();
                            let mut config_startup: shared::models::nest_egg::NestEggConfigStartup =
                                serde_json::from_value(config_startup.unwrap_or_default())
                                    .unwrap_or_default();
                            let config_stop: shared::models::nest_egg::NestEggConfigStop =
                                serde_json::from_str(config_stop.as_deref().unwrap_or(""))
                                    .unwrap_or_else(|_| {
                                        shared::models::nest_egg::NestEggConfigStop {
                                            r#type: "".into(),
                                            value: config_stop,
                                        }
                                    });
                            let config_allocations =
                                shared::models::nest_egg::NestEggConfigAllocations {
                                    user_self_assign: Default::default(),
                                };

                            if config_startup.done.is_empty() {
                                config_startup.done.push("".into());
                            }

                            sqlx::query(
                                r#"
                                INSERT INTO nest_eggs (
                                    uuid, nest_uuid, author, name, description, features, docker_images,
                                    file_denylist, config_files, config_startup, config_stop,
                                    config_script, config_allocations, startup, force_outgoing_ip, created
                                )
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(uuid.as_uuid())
                            .bind(nest_uuid)
                            .bind(author)
                            .bind(name)
                            .bind(description)
                            .bind(features)
                            .bind(docker_images)
                            .bind(file_denylist)
                            .bind(serde_json::to_value(config_files)?)
                            .bind(serde_json::to_value(config_startup)?)
                            .bind(serde_json::to_value(config_stop)?)
                            .bind(serde_json::to_value(config_script)?)
                            .bind(serde_json::to_value(config_allocations)?)
                            .bind(startup)
                            .bind(force_outgoing_ip)
                            .bind(created)
                            .execute(database.write())
                            .await?;

                            mapping.insert(id, *uuid.as_uuid());
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(egg_mappings) => egg_mappings,
                    Err(err) => {
                        tracing::error!("failed to process eggs table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                drop(nest_mappings);
                let egg_variable_mappings = match process_table(
                    &source_database,
                    "egg_variables",
                    None,
                    async |rows| {
                        let mut mapping: HashMap<u32, uuid::Uuid> = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let egg_id: u32 = row.try_get("egg_id")?;
                            let name: &str = row.try_get("name")?;
                            let description: Option<&str> = row.try_get("description")?;
                            let env_variable: &str = row.try_get("env_variable")?;
                            let default_value: Option<&str> = row.try_get("default_value")?;
                            let user_viewable: bool = row.try_get("user_viewable")?;
                            let user_editable: bool = row.try_get("user_editable")?;
                            let rules: &str = row.try_get("rules")?;
                            let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                            let egg_uuid = match egg_mappings.iter().find(|m| m.contains_key(&egg_id)) {
                                Some(egg_uuid) => egg_uuid.get(&egg_id).unwrap(),
                                None => continue,
                            };

                            let rules = rules.split('|').map(compact_str::CompactString::from).collect::<Vec<_>>();

                            if rule_validator::validate_rules(&rules).is_err() {
                                continue;
                            }

                            let row = sqlx::query(
                                r#"
                                INSERT INTO nest_egg_variables (egg_uuid, name, description, env_variable, default_value, user_viewable, user_editable, rules, created)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                                ON CONFLICT (egg_uuid, env_variable) DO UPDATE SET env_variable = EXCLUDED.env_variable
                                RETURNING uuid
                                "#,
                            )
                            .bind(egg_uuid)
                            .bind(name)
                            .bind(description)
                            .bind(env_variable)
                            .bind(default_value)
                            .bind(user_viewable)
                            .bind(user_editable)
                            .bind(rules)
                            .bind(created)
                            .fetch_one(database.write())
                            .await?;

                            mapping.insert(id, row.get("uuid"));
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(egg_variable_mappings) => egg_variable_mappings,
                    Err(err) => {
                        tracing::error!("failed to process egg_variables table: {:?}", err);
                        std::process::exit(1);
                    }
                };

                let database_host_mappings = match process_table(
                    &source_database,
                    "database_hosts",
                    None,
                    async |rows| {
                        let mut mapping: HashMap<u32, uuid::Uuid> = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let name: &str = row.try_get("name")?;
                            let host: &str = row.try_get("host")?;
                            let port: u16 = row.try_get("port")?;
                            let username: &str = row.try_get("username")?;
                            let password: &str = row.try_get("password")?;
                            let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                            let password = match decrypt_laravel_value(password, &source_app_key) {
                                Ok(password) => password,
                                Err(_) => continue,
                            };

                            let row = sqlx::query(
                                r#"
                                INSERT INTO database_hosts (name, public, type, host, port, username, password, created)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                                RETURNING uuid
                                "#,
                            )
                            .bind(name)
                            .bind(true)
                            .bind(shared::models::database_host::DatabaseType::Mysql)
                            .bind(host)
                            .bind(port as i32)
                            .bind(username)
                            .bind(database.encrypt(password).await.unwrap())
                            .bind(created)
                            .fetch_one(database.write())
                            .await?;

                            mapping.insert(id, row.get("uuid"));
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(nest_mappings) => nest_mappings,
                    Err(err) => {
                        tracing::error!("failed to process nests table: {:?}", err);
                        std::process::exit(1);
                    }
                };

                let server_mappings = match process_table(
                    &source_database,
                    "servers",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;
                            let allocation_id: u32 = row.try_get("allocation_id")?;

                            mapping.insert(id, (*uuid.as_uuid(), allocation_id));

                            let node_mappings = node_mappings.clone();
                            let user_mappings = user_mappings.clone();
                            let egg_mappings = egg_mappings.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let external_id: Option<&str> = row.try_get("external_id")?;
                                let node_id: u32 = row.try_get("node_id")?;
                                let name: &str = row.try_get("name")?;
                                let description: Option<&str> = row.try_get("description")?;
                                let status: Option<&str> = row.try_get("status")?;
                                let owner_id: u32 = row.try_get("owner_id")?;
                                let memory: u32 = row.try_get("memory")?;
                                let swap: i32 = row.try_get("swap")?;
                                let disk: u32 = row.try_get("disk")?;
                                let io_weight: u32 = row.try_get("io")?;
                                let cpu: u32 = row.try_get("cpu")?;
                                let egg_id: u32 = row.try_get("egg_id")?;
                                let startup: &str = row.try_get("startup")?;
                                let image: &str = row.try_get("image")?;
                                let allocation_limit: u32 = row.try_get("allocation_limit")?;
                                let database_limit: u32 = row.try_get("database_limit")?;
                                let backup_limit: u32 = row.try_get("backup_limit")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                let node_uuid = match node_mappings.iter().find(|m| m.contains_key(&node_id)) {
                                    Some(node_uuid) => node_uuid.get(&node_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let owner_uuid = match user_mappings.iter().find(|m| m.contains_key(&owner_id)) {
                                    Some(owner_uuid) => owner_uuid.get(&owner_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let egg_uuid = match egg_mappings.iter().find(|m| m.contains_key(&egg_id)) {
                                    Some(egg_uuid) => egg_uuid.get(&egg_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let (status, suspended) = match status {
                                    Some("installing") => (Some(shared::models::server::ServerStatus::Installing), false),
                                    Some("install_failed") => (Some(shared::models::server::ServerStatus::InstallFailed), false),
                                    Some("reinstall_failed") => (Some(shared::models::server::ServerStatus::InstallFailed), false),
                                    Some("restoring_backup") => {
                                        (Some(shared::models::server::ServerStatus::RestoringBackup), false)
                                    }
                                    Some("suspended") => (None, true),
                                    _ => (None, false),
                                };

                                sqlx::query(
                                    r#"
                                    INSERT INTO servers (
                                        uuid, uuid_short, external_id, node_uuid, name, description, status, suspended,
                                        owner_uuid, memory, swap, disk, io_weight, cpu, pinned_cpus, allocation_limit,
                                        database_limit, backup_limit, egg_uuid, startup, image, created
                                    )
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(uuid.as_uuid())
                                .bind(uuid.as_uuid().as_fields().0 as i32)
                                .bind(external_id)
                                .bind(node_uuid)
                                .bind(name)
                                .bind(description)
                                .bind(status)
                                .bind(suspended)
                                .bind(owner_uuid)
                                .bind(memory as i64)
                                .bind(swap as i64)
                                .bind(disk as i64)
                                .bind(io_weight as i16)
                                .bind(cpu as i32)
                                .bind(&[] as &[i32])
                                .bind(allocation_limit as i32)
                                .bind(database_limit as i32)
                                .bind(backup_limit as i32)
                                .bind(egg_uuid)
                                .bind(startup)
                                .bind(image)
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(mapping)
                    },
                    64,
                )
                .await
                {
                    Ok(nest_mappings) => nest_mappings,
                    Err(err) => {
                        tracing::error!("failed to process servers table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                if let Err(err) = process_table(
                    &source_database,
                    "databases",
                    None,
                    async |rows| {
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let server_mappings = server_mappings.clone();
                            let database_host_mappings = database_host_mappings.clone();
                            let source_app_key = source_app_key.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let server_id: u32 = row.try_get("server_id")?;
                                let database_host_id: u32 = row.try_get("database_host_id")?;
                                let database_name: &str = row.try_get("database")?;
                                let username: &str = row.try_get("username")?;
                                let password: &str = row.try_get("password")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                let server_uuid = match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                    Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                    None => return Ok(()),
                                };

                                let database_host_uuid = match database_host_mappings.iter().find(|m| m.contains_key(&database_host_id)) {
                                    Some(database_host_uuid) => database_host_uuid.get(&database_host_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let password = match decrypt_laravel_value(password, &source_app_key) {
                                    Ok(password) => password,
                                    Err(_) => return Ok(()),
                                };

                                sqlx::query(
                                    r#"
                                    INSERT INTO server_databases (server_uuid, database_host_uuid, name, username, password, created)
                                    VALUES ($1, $2, $3, $4, $5, $6)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(server_uuid)
                                .bind(database_host_uuid)
                                .bind(database_name)
                                .bind(username)
                                .bind(database.encrypt(password).await.unwrap())
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(())
                    },
                    64,
                )
                .await
                {
                    tracing::error!("failed to process databases table: {:?}", err);
                    std::process::exit(1);
                }
                if let Err(err) = process_table(
                    &source_database,
                    "server_variables",
                    None,
                    async |rows| {
                        for row in rows {
                            let server_id: u32 = row.try_get("server_id")?;
                            let variable_id: u32 = row.try_get("variable_id")?;
                            let variable_value: Option<&str> = row.try_get("variable_value")?;
                            let created: Option<chrono::DateTime<chrono::Utc>> =
                                row.try_get("created_at")?;

                            let server_uuid =
                                match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                    Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                    None => continue,
                                };

                            let variable_uuid = match egg_variable_mappings
                                .iter()
                                .find(|m| m.contains_key(&variable_id))
                            {
                                Some(variable_uuid) => variable_uuid.get(&variable_id).unwrap(),
                                None => continue,
                            };

                            sqlx::query(
                                r#"
                                INSERT INTO server_variables (server_uuid, variable_uuid, value, created)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(server_uuid)
                            .bind(variable_uuid)
                            .bind(variable_value)
                            .bind(created.unwrap_or_else(chrono::Utc::now))
                            .execute(database.write())
                            .await?;
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process databases table: {:?}", err);
                    std::process::exit(1);
                }
                if let Err(err) = process_table(
                    &source_database,
                    "backups",
                    None,
                    async |rows| {
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let server_mappings = server_mappings.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;
                                let server_id: u32 = row.try_get("server_id")?;
                                let successful: bool = row.try_get("is_successful")?;
                                let locked: bool = row.try_get("is_locked")?;
                                let name: &str = row.try_get("name")?;
                                let ignored_files: Option<serde_json::Value> = row.try_get("ignored_files")?;
                                let disk: &str = row.try_get("disk")?;
                                let checksum: Option<&str> = row.try_get("checksum")?;
                                let bytes: u64 = row.try_get("bytes")?;
                                let completed: Option<chrono::DateTime<chrono::Utc>> = row.try_get("completed_at")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;
                                let deleted: Option<chrono::DateTime<chrono::Utc>> = row.try_get("deleted_at")?;

                                let server_uuid = match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                    Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                    None => return Ok(()),
                                };

                                let ignored_files: Vec<String> = serde_json::from_value(
                                    ignored_files.unwrap_or_else(|| serde_json::Value::Array(vec![])),
                                )
                                .unwrap_or_default();

                                sqlx::query(
                                    r#"
                                    INSERT INTO server_backups (uuid, server_uuid, node_uuid, backup_configuration_uuid, name, successful, browsable, streaming, locked, ignored_files, disk, checksum, bytes, completed, deleted, created)
                                    VALUES ($1, $2, (SELECT node_uuid FROM servers WHERE uuid = $2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(uuid.as_uuid())
                                .bind(server_uuid)
                                .bind(backup_configuration_uuid)
                                .bind(name)
                                .bind(successful)
                                .bind(matches!(disk, "ddup-bak" | "btrfs" | "zfs" | "restic"))
                                .bind(matches!(disk, "ddup-bak" | "btrfs" | "zfs" | "restic"))
                                .bind(locked)
                                .bind(ignored_files)
                                .bind(match disk {
                                    "wings" => shared::models::server_backup::BackupDisk::Local,
                                    "s3" => shared::models::server_backup::BackupDisk::S3,
                                    "ddup-bak" => shared::models::server_backup::BackupDisk::DdupBak,
                                    "btrfs" => shared::models::server_backup::BackupDisk::Btrfs,
                                    "zfs" => shared::models::server_backup::BackupDisk::Zfs,
                                    "restic" => shared::models::server_backup::BackupDisk::Restic,
                                    _ => shared::models::server_backup::BackupDisk::Local,
                                })
                                .bind(checksum)
                                .bind(bytes as i64)
                                .bind(completed)
                                .bind(deleted)
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(())
                    },
                    64,
                )
                .await
                {
                    tracing::error!("failed to process backups table: {:?}", err);
                    std::process::exit(1);
                }
                if let Err(err) = process_table(
                    &source_database,
                    "subusers",
                    None,
                    async |rows| {
                        let mut futures = Vec::with_capacity(rows.len());

                        for row in rows {
                            let user_mappings = user_mappings.clone();
                            let server_mappings = server_mappings.clone();
                            let database = database.clone();
                            futures.push(async move {
                                let user_id: u32 = row.try_get("user_id")?;
                                let server_id: u32 = row.try_get("server_id")?;
                                let permissions: serde_json::Value = row.try_get("permissions")?;
                                let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                                let user_uuid = match user_mappings.iter().find(|m| m.contains_key(&user_id)) {
                                    Some(user_uuid) => user_uuid.get(&user_id).unwrap(),
                                    None => return Ok(()),
                                };

                                let server_uuid = match server_mappings.iter().find(|m| m.contains_key(&server_id))
                                {
                                    Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                    None => return Ok(()),
                                };

                                let raw_permissions: Vec<String> =
                                    serde_json::from_value(permissions).unwrap_or_default();
                                let mut permissions = HashSet::with_capacity(raw_permissions.len());

                                for permission in raw_permissions {
                                    permissions.insert(match permission.as_str() {
                                        "control.console" => "control.console",
                                        "control.start" => "control.start",
                                        "control.stop" => "control.stop",
                                        "control.restart" => "control.restart",
                                        "user.create" => "subusers.create",
                                        "user.read" => "subusers.read",
                                        "user.update" => "subusers.update",
                                        "user.delete" => "subusers.delete",
                                        "file.create" => "files.create",
                                        "file.read" => "files.read",
                                        "file.read-content" => "files.read-content",
                                        "file.update" => "files.update",
                                        "file.delete" => "files.delete",
                                        "file.archive" => "files.archive",
                                        "backup.create" => "backups.create",
                                        "backup.read" => "backups.read",
                                        "backup.download" => "backups.download",
                                        "backup.restore" => "backups.restore",
                                        "backup.delete" => "backups.delete",
                                        "allocation.create" => "allocations.create",
                                        "allocation.read" => "allocations.read",
                                        "allocation.update" => "allocations.update",
                                        "allocation.delete" => "allocations.delete",
                                        "startup.read" => "startup.read",
                                        "startup.update" => "startup.update",
                                        "startup.docker-image" => "startup.docker-image",
                                        "database.create" => "databases.create",
                                        "database.read" => "databases.read",
                                        "database.update" => "databases.update",
                                        "database.view_password" => "databases.read-password",
                                        "database.delete" => "databases.delete",
                                        "schedule.create" => "schedules.create",
                                        "schedule.read" => "schedules.read",
                                        "schedule.update" => "schedules.update",
                                        "schedule.delete" => "schedules.delete",
                                        "settings.rename" => "settings.rename",
                                        "settings.reinstall" => "settings.install",
                                        "activity.read" => "activity.read",
                                        _ => continue,
                                    });

                                    if permission == "control.console" {
                                        permissions.insert("control.read-console");
                                    }
                                }

                                sqlx::query(
                                    r#"
                                    INSERT INTO server_subusers (server_uuid, user_uuid, permissions, ignored_files, created)
                                    VALUES ($1, $2, $3, $4, $5)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(server_uuid)
                                .bind(user_uuid)
                                .bind(permissions.into_iter().collect::<Vec<&str>>())
                                .bind(&[] as &[&str])
                                .bind(created)
                                .execute(database.write())
                                .await?;

                                Ok::<(), anyhow::Error>(())
                            });
                        }

                        futures_util::future::try_join_all(futures).await?;

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process subusers table: {:?}", err);
                    std::process::exit(1);
                }
                drop(user_mappings);

                let mount_mappings = match process_table(
                    &source_database,
                    "mounts",
                    None,
                    async |rows| {
                        let mut mapping = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let uuid: uuid::fmt::Hyphenated = row.try_get("uuid")?;
                            let name: &str = row.try_get("name")?;
                            let description: Option<&str> = row.try_get("description")?;
                            let source: &str = row.try_get("source")?;
                            let target: &str = row.try_get("target")?;
                            let read_only: bool = row.try_get("read_only")?;
                            let user_mountable: bool = row.try_get("user_mountable")?;

                            sqlx::query(
                                r#"
                                INSERT INTO mounts (uuid, name, description, source, target, read_only, user_mountable, created)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(uuid.as_uuid())
                            .bind(name)
                            .bind(description)
                            .bind(source)
                            .bind(target)
                            .bind(read_only)
                            .bind(user_mountable)
                            .execute(database.write())
                            .await?;

                            mapping.insert(id, *uuid.as_uuid());
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(mount_mappings) => mount_mappings,
                    Err(err) => {
                        tracing::error!("failed to process mounts table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                if let Err(err) = process_table(
                    &source_database,
                    "egg_mount",
                    None,
                    async |rows| {
                        for row in rows {
                            let egg_id: u32 = row.try_get("egg_id")?;
                            let mount_id: u32 = row.try_get("mount_id")?;

                            let egg_uuid =
                                match egg_mappings.iter().find(|m| m.contains_key(&egg_id)) {
                                    Some(egg_uuid) => egg_uuid.get(&egg_id).unwrap(),
                                    None => continue,
                                };

                            let mount_uuid =
                                match mount_mappings.iter().find(|m| m.contains_key(&mount_id)) {
                                    Some(mount_uuid) => mount_uuid.get(&mount_id).unwrap(),
                                    None => continue,
                                };

                            sqlx::query(
                                r#"
                                INSERT INTO nest_egg_mounts (egg_uuid, mount_uuid, created)
                                VALUES ($1, $2, NOW())
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(egg_uuid)
                            .bind(mount_uuid)
                            .execute(database.write())
                            .await?;
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process egg mounts table: {:?}", err);
                    std::process::exit(1);
                }
                if let Err(err) = process_table(
                    &source_database,
                    "mount_node",
                    None,
                    async |rows| {
                        for row in rows {
                            let node_id: u32 = row.try_get("node_id")?;
                            let mount_id: u32 = row.try_get("mount_id")?;

                            let node_uuid =
                                match node_mappings.iter().find(|m| m.contains_key(&node_id)) {
                                    Some(node_uuid) => node_uuid.get(&node_id).unwrap(),
                                    None => continue,
                                };

                            let mount_uuid =
                                match mount_mappings.iter().find(|m| m.contains_key(&mount_id)) {
                                    Some(mount_uuid) => mount_uuid.get(&mount_id).unwrap(),
                                    None => continue,
                                };

                            sqlx::query(
                                r#"
                                INSERT INTO node_mounts (node_uuid, mount_uuid, created)
                                VALUES ($1, $2, NOW())
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(node_uuid)
                            .bind(mount_uuid)
                            .execute(database.write())
                            .await?;
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process node mounts table: {:?}", err);
                    std::process::exit(1);
                }
                if let Err(err) = process_table(
                    &source_database,
                    "mount_server",
                    None,
                    async |rows| {
                        for row in rows {
                            let server_id: u32 = row.try_get("server_id")?;
                            let mount_id: u32 = row.try_get("mount_id")?;

                            let server_uuid =
                                match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                    Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                    None => continue,
                                };

                            let mount_uuid =
                                match mount_mappings.iter().find(|m| m.contains_key(&mount_id)) {
                                    Some(mount_uuid) => mount_uuid.get(&mount_id).unwrap(),
                                    None => continue,
                                };

                            sqlx::query(
                                r#"
                                INSERT INTO server_mounts (server_uuid, mount_uuid, created)
                                VALUES ($1, $2, NOW())
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(server_uuid)
                            .bind(mount_uuid)
                            .execute(database.write())
                            .await?;
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process server mounts table: {:?}", err);
                    std::process::exit(1);
                }
                drop(mount_mappings);

                let schedule_mappings = match process_table(
                    &source_database,
                    "schedules",
                    None,
                    async |rows| {
                        let mut mapping: HashMap<u32, uuid::Uuid> = HashMap::with_capacity(rows.len());

                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let server_id: u32 = row.try_get("server_id")?;
                            let name: &str = row.try_get("name")?;
                            let enabled: bool = row.try_get("is_active")?;
                            let only_when_online: bool = row.try_get("only_when_online")?;
                            let cron_day_of_week: &str = row.try_get("cron_day_of_week")?;
                            let cron_month: &str = row.try_get("cron_month")?;
                            let cron_day_of_month: &str = row.try_get("cron_day_of_month")?;
                            let cron_hour: &str = row.try_get("cron_hour")?;
                            let cron_minute: &str = row.try_get("cron_minute")?;
                            let last_run: Option<chrono::DateTime<chrono::Utc>> = row.try_get("last_run_at")?;
                            let created: chrono::DateTime<chrono::Utc> = row.try_get("created_at")?;

                            let server_uuid = match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                Some(server_uuid) => server_uuid.get(&server_id).unwrap().0,
                                None => continue,
                            };

                            let schedule = match cron::Schedule::from_str(&format!(
                                "0 {} {} {} {} {}",
                                cron_minute, cron_hour, cron_day_of_month, cron_month, cron_day_of_week
                            )) {
                                Ok(schedule) => schedule,
                                Err(_) => continue,
                            };

                            let row = sqlx::query(
                                r#"
                                INSERT INTO server_schedules (server_uuid, name, enabled, triggers, condition, last_run, created)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)
                                ON CONFLICT (server_uuid, name) DO UPDATE SET name = EXCLUDED.name
                                RETURNING uuid
                                "#,
                            )
                            .bind(server_uuid)
                            .bind(name)
                            .bind(enabled)
                            .bind(serde_json::to_value(vec![
                                wings_api::ScheduleTrigger::Cron { schedule: Box::new(schedule) }
                            ])?)
                            .bind(serde_json::to_value(if only_when_online {
                                wings_api::SchedulePreCondition::Or {
                                    conditions: vec![
                                        wings_api::SchedulePreCondition::ServerState {
                                            state: wings_api::ServerState::Starting
                                        },
                                        wings_api::SchedulePreCondition::ServerState {
                                            state: wings_api::ServerState::Running
                                        }
                                    ]
                                }
                            } else {
                                wings_api::SchedulePreCondition::None
                            })?)
                            .bind(last_run)
                            .bind(created)
                            .fetch_one(database.write())
                            .await?;

                            mapping.insert(id, row.get("uuid"));
                        }

                        Ok(mapping)
                    },
                    256,
                )
                .await
                {
                    Ok(schedule_mappings) => schedule_mappings,
                    Err(err) => {
                        tracing::error!("failed to process schedules table: {:?}", err);
                        std::process::exit(1);
                    }
                };
                if let Err(err) = process_table(
                    &source_database,
                    "tasks",
                    None,
                    async |rows| {
                        for row in rows {
                            let schedule_id: u32 = row.try_get("schedule_id")?;
                            let sequence_id: u32 = row.try_get("sequence_id")?;
                            let action: &str = row.try_get("action")?;
                            let payload: &str = row.try_get("payload")?;
                            let time_offset: u32 = row.try_get("time_offset")?;
                            let continue_on_failure: bool = row.try_get("continue_on_failure")?;
                            let created: chrono::DateTime<chrono::Utc> =
                                row.try_get("created_at")?;

                            let schedule_uuid = match schedule_mappings
                                .iter()
                                .find(|m| m.contains_key(&schedule_id))
                            {
                                Some(schedule_uuid) => schedule_uuid.get(&schedule_id).unwrap(),
                                None => continue,
                            };

                            let mut actions = Vec::new();
                            actions.reserve_exact(2);

                            if time_offset > 0 {
                                actions.push(wings_api::ScheduleActionInner::Sleep {
                                    duration: time_offset as u64 * 1000,
                                });
                            }

                            match action {
                                "command" => {
                                    actions.push(wings_api::ScheduleActionInner::SendCommand {
                                        command: wings_api::ScheduleDynamicParameter::Raw(payload.into()),
                                        ignore_failure: continue_on_failure,
                                    })
                                }
                                "power" => {
                                    let power_action = match payload {
                                        "start" => wings_api::ServerPowerAction::Start,
                                        "stop" => wings_api::ServerPowerAction::Stop,
                                        "restart" => wings_api::ServerPowerAction::Restart,
                                        "kill" => wings_api::ServerPowerAction::Kill,
                                        _ => continue,
                                    };

                                    actions.push(wings_api::ScheduleActionInner::SendPower {
                                        action: power_action,
                                        ignore_failure: continue_on_failure,
                                    });
                                }
                                "backup" => {
                                    actions.push(wings_api::ScheduleActionInner::CreateBackup {
                                        name: None,
                                        ignored_files: payload
                                            .split('\n')
                                            .map(compact_str::CompactString::from)
                                            .collect::<Vec<_>>(),
                                        foreground: true,
                                        ignore_failure: continue_on_failure,
                                    })
                                }
                                _ => continue,
                            }

                            for (i, action) in actions.into_iter().enumerate() {
                                sqlx::query(
                                    r#"
                                    INSERT INTO server_schedule_steps (schedule_uuid, action, order_, created)
                                    VALUES ($1, $2, $3, $4)
                                    ON CONFLICT DO NOTHING
                                    "#,
                                )
                                .bind(schedule_uuid)
                                .bind(serde_json::to_value(action)?)
                                .bind(sequence_id as i16)
                                .bind(created + chrono::Duration::milliseconds(i as i64))
                                .execute(database.write())
                                .await?;
                            }
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process schedule tasks table: {:?}", err);
                    std::process::exit(1);
                }
                drop(schedule_mappings);

                if let Err(err) = process_table(
                    &source_database,
                    "allocations",
                    None,
                    async |rows| {
                        for row in rows {
                            let id: u32 = row.try_get("id")?;
                            let node_id: u32 = row.try_get("node_id")?;
                            let ip: &str = row.try_get("ip")?;
                            let ip_alias: Option<&str> = row.try_get("ip_alias")?;
                            let port: u16 = row.try_get("port")?;
                            let server_id: Option<u32> = row.try_get("server_id")?;
                            let notes: Option<&str> = if server_id.is_some() {
                                row.try_get("notes")?
                            } else {
                                None
                            };
                            let created: Option<chrono::DateTime<chrono::Utc>> = row.try_get("created_at")?;

                            let node_uuid = match node_mappings.iter().find(|m| m.contains_key(&node_id)) {
                                Some(node_uuid) => node_uuid.get(&node_id).unwrap(),
                                None => continue,
                            };

                            let server_uuid = if let Some(server_id) = server_id {
                                match server_mappings.iter().find(|m| m.contains_key(&server_id)) {
                                    Some(server_uuid) => server_uuid.get(&server_id),
                                    None => continue,
                                }
                            } else {
                                None
                            };

                            let ip = match sqlx::types::ipnetwork::IpNetwork::from_str(ip) {
                                Ok(ip) => ip,
                                Err(_) => continue,
                            };

                            let row = sqlx::query(
                                r#"
                                INSERT INTO node_allocations (node_uuid, ip, ip_alias, port, created)
                                VALUES ($1, $2, $3, $4, NOW())
                                ON CONFLICT (node_uuid, host(ip), port) DO UPDATE SET port = EXCLUDED.port
                                RETURNING uuid
                                "#,
                            )
                            .bind(node_uuid)
                            .bind(ip)
                            .bind(ip_alias)
                            .bind(port as i32)
                            .fetch_one(database.write())
                            .await?;

                            if let Some((server_uuid, allocation_id)) = server_uuid {
                                let row = sqlx::query(
                                    r#"
                                    INSERT INTO server_allocations (server_uuid, allocation_uuid, notes, created)
                                    VALUES ($1, $2, $3, $4)
                                    ON CONFLICT (allocation_uuid) DO UPDATE SET allocation_uuid = EXCLUDED.allocation_uuid
                                    RETURNING uuid
                                    "#,
                                )
                                .bind(server_uuid)
                                .bind(row.get::<uuid::Uuid, _>("uuid"))
                                .bind(notes)
                                .bind(created.unwrap_or_else(chrono::Utc::now))
                                .fetch_one(database.write())
                                .await?;

                                if id == *allocation_id {
                                    sqlx::query(
                                        r#"
                                        UPDATE servers
                                        SET allocation_uuid = $1
                                        WHERE servers.uuid = $2
                                        "#,
                                    )
                                    .bind(row.get::<uuid::Uuid, _>("uuid"))
                                    .bind(server_uuid)
                                    .execute(database.write())
                                    .await?;
                                }
                            }
                        }

                        Ok(())
                    },
                    100,
                )
                .await
                {
                    tracing::error!("failed to process allocations table: {:?}", err);
                    std::process::exit(1);
                }

                Ok(())
            })
        })
    }
}

#[inline]
fn extract_php_serialized_string(
    serialized_data: &str,
) -> Result<compact_str::CompactString, anyhow::Error> {
    if !serialized_data.starts_with("s:") {
        return Ok(serialized_data.into());
    }

    let first_colon = match serialized_data.find(':') {
        Some(pos) => pos,
        None => return Err(anyhow::anyhow!("Invalid PHP serialized string format")),
    };

    let second_colon_start = first_colon + 1;
    let second_colon = match serialized_data[second_colon_start..].find(':') {
        Some(pos) => second_colon_start + pos,
        None => return Err(anyhow::anyhow!("Invalid PHP serialized string format")),
    };

    let length_str = &serialized_data[first_colon + 1..second_colon];
    let length: usize = length_str.parse()?;

    if serialized_data.len() <= second_colon + 1
        || &serialized_data[second_colon + 1..second_colon + 2] != "\""
    {
        return Err(anyhow::anyhow!(
            "Invalid PHP serialized string format, missing opening quote"
        ));
    }

    let content_start = second_colon + 2;
    let expected_end = content_start + length;

    if serialized_data.len() < expected_end + 2 {
        return Err(anyhow::anyhow!(
            "Invalid PHP serialized string format, string is truncated"
        ));
    }

    if &serialized_data[expected_end..expected_end + 2] != "\";" {
        return Err(anyhow::anyhow!(
            "Invalid PHP serialized string format, missing closing quote or semicolon"
        ));
    }

    Ok(serialized_data[content_start..expected_end].into())
}

fn decrypt_laravel_value(
    encrypted_value: &str,
    decoded_key: &[u8],
) -> Result<compact_str::CompactString, anyhow::Error> {
    let clean_value = encrypted_value.trim_start_matches("base64:");
    let decoded = BASE64_ENGINE.decode(clean_value)?;

    #[derive(Deserialize)]
    struct LaravelEncrypted {
        iv: compact_str::CompactString,
        value: compact_str::CompactString,
    }

    let payload: LaravelEncrypted = serde_json::from_slice(&decoded)?;

    let iv = BASE64_ENGINE.decode(&payload.iv)?;
    let value = BASE64_ENGINE.decode(&payload.value)?;

    let key = &decoded_key[0..32];
    let decrypted = openssl::symm::decrypt(Cipher::aes_256_cbc(), key, Some(&iv), &value)?;

    let result = compact_str::CompactString::from_utf8(decrypted)?;

    extract_php_serialized_string(&result)
}

pub async fn process_table<T, Fut: Future<Output = Result<T, anyhow::Error>>>(
    source_database: &sqlx::Pool<sqlx::MySql>,
    table: &str,
    sql_where: Option<&str>,
    compute: impl Fn(Vec<sqlx::mysql::MySqlRow>) -> Fut,
    page_size: usize,
) -> Result<Vec<T>, anyhow::Error> {
    tracing::info!(table, "starting processing");

    let mut offset: usize = 0;
    let mut results = Vec::new();

    loop {
        tracing::info!(table, offset, "processing");

        let rows = sqlx::query(&format!(
            "SELECT * FROM `{table}` {} LIMIT {page_size} OFFSET {offset}",
            if let Some(where_clause) = sql_where {
                format!("WHERE {where_clause}")
            } else {
                String::new()
            }
        ))
        .fetch_all(source_database)
        .await?;

        if rows.is_empty() {
            break;
        }

        let result = compute(rows).await?;

        if std::mem::size_of_val(&result) > 0 {
            results.push(result);
        }

        offset += page_size;
    }

    Ok(results)
}
