use axum::{
    ServiceExt,
    body::Body,
    extract::{ConnectInfo, Path, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
    routing::get,
};
use clap::{Arg, Command};
use colored::Colorize;
use include_dir::{Dir, include_dir};
use sentry_tower::SentryHttpLayer;
use sha2::Digest;
use shared::{ApiError, GetState, response::ApiResponse};
use std::{net::SocketAddr, sync::Arc, time::Instant};
use tower::Layer;
use tower_cookies::CookieManagerLayer;
use tower_http::normalize_path::NormalizePathLayer;
use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa_axum::router::OpenApiRouter;

#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

const FRONTEND_ASSETS: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../frontend/dist");

fn cli() -> Command {
    Command::new("panel-rs")
        .about(
            "The API server allowing programmatic control of game servers for Pterodactyl Panel.",
        )
        .allow_external_subcommands(true)
        .subcommand(
            Command::new("version")
                .about("Prints the current executable version and exits.")
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("service-install")
                .about("Installs the Wings service on the system.")
                .arg(
                    Arg::new("override")
                        .help("set to true to override an existing service file")
                        .num_args(0)
                        .long("override")
                        .default_value("false")
                        .value_parser(clap::value_parser!(bool))
                        .required(false),
                )
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("import")
                .about("Imports the database from pterodactyl.")
                .arg(
                    Arg::new("environment")
                        .help("path to the pterodactyl environment variables file")
                        .num_args(1)
                        .short('e')
                        .long("environment")
                        .default_value("/var/www/pterodactyl/.env")
                        .required(false),
                )
                .arg_required_else_help(false),
        )
        .subcommand(
            Command::new("diagnostics")
                .about("Collect and report information about this Panel to assist in debugging.")
                .arg(
                    Arg::new("log_lines")
                        .help("the number of log lines to include in the report")
                        .num_args(1)
                        .short('l')
                        .long("log-lines")
                        .default_value("500")
                        .value_parser(clap::value_parser!(usize))
                        .required(false),
                )
                .arg_required_else_help(false),
        )
}

async fn handle_request(
    connect_info: ConnectInfo<SocketAddr>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response<Body>, StatusCode> {
    let ip = shared::utils::extract_ip(req.headers()).unwrap_or_else(|| connect_info.ip());

    req.extensions_mut().insert(ip);

    tracing::info!(
        "http {} {}{}",
        req.method().to_string().to_lowercase(),
        req.uri().path().cyan(),
        if let Some(query) = req.uri().query() {
            format!("?{query}")
        } else {
            "".to_string()
        }
        .bright_cyan()
    );

    Ok(next.run(req).await)
}

async fn handle_postprocessing(req: Request, next: Next) -> Result<Response, StatusCode> {
    let if_none_match = req.headers().get("If-None-Match").cloned();
    let mut response = next.run(req).await;

    if let Some(content_type) = response.headers().get("Content-Type")
        && content_type
            .to_str()
            .map(|c| c.starts_with("text/plain"))
            .unwrap_or(false)
        && response.status().is_client_error()
        && response.status() != StatusCode::NOT_FOUND
    {
        let (mut parts, body) = response.into_parts();

        let text_body = String::from_utf8(
            axum::body::to_bytes(body, usize::MAX)
                .await
                .unwrap()
                .into_iter()
                .by_ref()
                .collect::<Vec<u8>>(),
        )
        .unwrap();

        parts
            .headers
            .insert("Content-Type", "application/json".parse().unwrap());

        response = Response::from_parts(
            parts,
            Body::from(ApiError::new_value(&[&text_body]).to_string()),
        );
    }

    let (mut parts, body) = response.into_parts();
    let body_bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();

    let mut hash = sha2::Sha256::new();
    hash.update(body_bytes.as_ref());
    let hash = format!("{:x}", hash.finalize());

    parts.headers.insert("ETag", hash.parse().unwrap());

    if if_none_match == Some(hash.parse().unwrap()) {
        let mut cached_response = Response::builder()
            .status(StatusCode::NOT_MODIFIED)
            .body(Body::empty())
            .unwrap();

        for (key, value) in parts.headers.iter() {
            cached_response.headers_mut().insert(key, value.clone());
        }

        return Ok(cached_response);
    }

    Ok(Response::from_parts(parts, Body::from(body_bytes)))
}

#[tokio::main]
async fn main() {
    let matches = cli().get_matches();

    let env = shared::env::Env::parse();

    match matches.subcommand() {
        Some(("version", sub_matches)) => std::process::exit(
            panel_rs::commands::version::version(sub_matches, env.as_ref().ok().map(|c| &c.0))
                .await,
        ),
        Some(("service-install", sub_matches)) => std::process::exit(
            panel_rs::commands::service_install::service_install(
                sub_matches,
                env.as_ref().ok().map(|c| &c.0),
            )
            .await,
        ),
        Some(("import", sub_matches)) => std::process::exit(
            panel_rs::commands::import::import(sub_matches, env.as_ref().ok().map(|c| &c.0)).await,
        ),
        Some(("diagnostics", sub_matches)) => std::process::exit(
            panel_rs::commands::diagnostics::diagnostics(
                sub_matches,
                env.as_ref().ok().map(|c| &c.0),
            )
            .await,
        ),
        None => {
            tracing::info!("                         _");
            tracing::info!("  _ __   __ _ _ __   ___| |");
            tracing::info!(" | '_ \\ / _` | '_ \\ / _ \\ |");
            tracing::info!(" | |_) | (_| | | | |  __/ |");
            tracing::info!(" | .__/ \\__,_|_| |_|\\___|_|____");
            tracing::info!(" | |                  | '__/ __|");
            tracing::info!(" |_|                  | |  \\__ \\");
            tracing::info!(
                "{: >21} |_|  |___/",
                format!("{} (git-{})", shared::VERSION, shared::GIT_COMMIT)
            );
            tracing::info!("github.com/calagopus-rs/panel\n");
        }
        _ => {
            cli().print_help().unwrap();
            std::process::exit(0);
        }
    }

    let (env, _tracing_guard) = match env {
        Ok((env, tracing_guard)) => (env, tracing_guard),
        Err(err) => {
            eprintln!("{}: {err:#?}", "failed to parse environment".red());
            std::process::exit(1);
        }
    };

    let _guard = sentry::init((
        env.sentry_url.clone(),
        sentry::ClientOptions {
            server_name: env.server_name.clone().map(|s| s.into()),
            release: Some(format!("{}:{}", shared::VERSION, shared::GIT_COMMIT).into()),
            traces_sample_rate: 1.0,
            ..Default::default()
        },
    ));

    let env = Arc::new(env);
    //let s3 = Arc::new(s3::S3::new(env.clone()).await);
    let jwt = Arc::new(shared::jwt::Jwt::new(&env));
    let database = Arc::new(shared::database::Database::new(&env).await);
    let cache = Arc::new(shared::cache::Cache::new(&env).await);

    if env.database_migrate {
        tracing::info!("running database migrations...");
        match database.migrate().await {
            Ok(_) => tracing::info!("database migrations completed successfully"),
            Err(err) => {
                tracing::error!("failed to run database migrations: {:#?}", err);
                std::process::exit(1);
            }
        }
    }

    let extensions = Arc::new(shared::extensions::manager::ExtensionManager::new(
        extension_internal_list::list(),
    ));
    let settings = Arc::new(shared::settings::Settings::new(database.clone()).await);
    let storage = Arc::new(shared::storage::Storage::new(settings.clone()));
    let captcha = Arc::new(shared::captcha::Captcha::new(settings.clone()));
    let mail = Arc::new(shared::mail::Mail::new(settings.clone()));

    let state = Arc::new(shared::AppState {
        start_time: Instant::now(),
        version: format!("{}:{}", shared::VERSION, shared::GIT_COMMIT),

        client: reqwest::ClientBuilder::new()
            .user_agent(format!("github.com/calagopus-rs/panel {}", shared::VERSION))
            .build()
            .unwrap(),

        extensions: extensions.clone(),
        settings: settings.clone(),
        jwt,
        storage,
        captcha,
        mail,
        database: database.clone(),
        cache: cache.clone(),
        env,
    });

    let routes = extensions.init(state.clone()).await;
    let mut extension_router = OpenApiRouter::new().with_state(state.clone());

    if let Some(global) = routes.global {
        extension_router = extension_router.merge(*global);
    }
    if let Some(api_admin) = routes.api_admin {
        extension_router = extension_router.nest(
            "/api/admin",
            api_admin
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::client::auth,
                ))
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::admin::auth,
                )),
        );
    }
    if let Some(api_auth) = routes.api_auth {
        extension_router = extension_router.nest("/api/auth", *api_auth);
    }
    if let Some(api_client) = routes.api_client {
        extension_router = extension_router.nest(
            "/api/client",
            api_client.route_layer(axum::middleware::from_fn_with_state(
                state.clone(),
                panel_rs::routes::api::client::auth,
            )),
        );
    }
    if let Some(api_client_servers_server) = routes.api_client_servers_server {
        extension_router = extension_router.nest(
            "/api/client/servers/{server}",
            api_client_servers_server
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::client::auth,
                ))
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::client::servers::_server_::auth,
                )),
        );
    }
    if let Some(api_remote) = routes.api_remote {
        extension_router = extension_router.nest(
            "/api/remote",
            api_remote.route_layer(axum::middleware::from_fn_with_state(
                state.clone(),
                panel_rs::routes::api::remote::auth,
            )),
        );
    }
    if let Some(api_remote_servers_server) = routes.api_remote_servers_server {
        extension_router = extension_router.nest(
            "/api/remote/servers/{server}",
            api_remote_servers_server
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::remote::auth,
                ))
                .route_layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    panel_rs::routes::api::remote::servers::_server_::auth,
                )),
        );
    }

    let app = OpenApiRouter::new()
        .merge(panel_rs::routes::router(&state))
        .merge(extension_router)
        .route(
            "/avatars/{user}/{file}",
            get(
                |state: GetState, Path::<(uuid::Uuid, String)>((user, file))| async move {
                    let settings = state.settings.get().await;

                    if file.len() != 13 || file.contains("..") || !file.ends_with(".webp") {
                        return ApiResponse::error("file not found")
                            .with_status(StatusCode::NOT_FOUND)
                            .ok();
                    }

                    let base_path = match &settings.storage_driver {
                        shared::settings::StorageDriver::Filesystem { path } => {
                            std::path::Path::new(path)
                        }
                        _ => {
                            return ApiResponse::error("file not found")
                                .with_status(StatusCode::NOT_FOUND)
                                .ok();
                        }
                    };

                    let path = base_path.join(format!("avatars/{user}/{file}"));
                    let size = match tokio::fs::metadata(&path).await {
                        Ok(metadata) => metadata.len(),
                        Err(_) => {
                            return ApiResponse::error("file not found")
                                .with_status(StatusCode::NOT_FOUND)
                                .ok();
                        }
                    };

                    let tokio_file = match tokio::fs::File::open(path).await {
                        Ok(file) => file,
                        Err(_) => {
                            return ApiResponse::error("file not found")
                                .with_status(StatusCode::NOT_FOUND)
                                .ok();
                        }
                    };

                    ApiResponse::new(Body::from_stream(tokio_util::io::ReaderStream::new(
                        tokio_file,
                    )))
                    .with_header("Content-Length", &size.to_string())
                    .with_header("ETag", file.trim_end_matches(".webp"))
                    .ok()
                },
            ),
        )
        .fallback(|req: Request<Body>| async move {
            if !req.uri().path().starts_with("/api") {
                let path = &req.uri().path()[1..];

                let entry = match FRONTEND_ASSETS.get_entry(path) {
                    Some(entry) => entry,
                    None => FRONTEND_ASSETS.get_entry("index.html").unwrap(),
                };

                let file = match entry {
                    include_dir::DirEntry::File(file) => file,
                    include_dir::DirEntry::Dir(dir) => match dir.get_file("index.html") {
                        Some(index_file) => index_file,
                        None => FRONTEND_ASSETS.get_file("index.html").unwrap(),
                    },
                };

                return Response::builder()
                    .header(
                        "Content-Type",
                        match infer::get(file.contents()) {
                            Some(kind) => kind.mime_type(),
                            _ => match file.path().extension() {
                                Some(ext) => match ext.to_str() {
                                    Some("html") => "text/html",
                                    Some("js") => "application/javascript",
                                    Some("css") => "text/css",
                                    Some("json") => "application/json",
                                    Some("svg") => "image/svg+xml",
                                    _ => "application/octet-stream",
                                },
                                None => "application/octet-stream",
                            },
                        },
                    )
                    .body(Body::from(file.contents()))
                    .unwrap();
            }

            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    ApiError::new_value(&["route not found"]).to_string(),
                ))
                .unwrap()
        })
        .layer(axum::middleware::from_fn(handle_request))
        .layer(CookieManagerLayer::new())
        .route_layer(axum::middleware::from_fn(handle_postprocessing))
        .route_layer(SentryHttpLayer::new().enable_transaction())
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", &state.env.bind, state.env.port))
        .await
        .unwrap();

    tracing::info!(
        "{} listening on {} {}",
        "http server".bright_red(),
        state.env.bind.cyan(),
        format!(
            "(app@{}, {}ms)",
            shared::VERSION,
            state.start_time.elapsed().as_millis()
        )
        .bright_black()
    );

    let settings = settings.get().await;

    let (router, mut openapi) = app.split_for_parts();
    openapi.info.version = state.version.clone();
    openapi.info.description = None;
    openapi.info.title = format!("{} API", settings.app.name);
    openapi.info.contact = None;
    openapi.info.license = None;
    openapi.servers = Some(vec![utoipa::openapi::Server::new(settings.app.url.clone())]);
    openapi.components.as_mut().unwrap().add_security_scheme(
        "api_key",
        SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new("Authorization"))),
    );

    drop(settings);

    let router = router.route("/openapi.json", get(|| async move { axum::Json(openapi) }));

    axum::serve(
        listener,
        ServiceExt::<Request>::into_make_service_with_connect_info::<SocketAddr>(
            NormalizePathLayer::trim_trailing_slash().layer(router),
        ),
    )
    .await
    .unwrap();
}
