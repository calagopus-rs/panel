use axum::{
    ServiceExt,
    body::Body,
    extract::{ConnectInfo, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
    routing::get,
};
use clap::{Arg, Command};
use colored::Colorize;
use include_dir::{Dir, include_dir};
use routes::ApiError;
use sentry_tower::SentryHttpLayer;
use sha2::Digest;
use std::{net::SocketAddr, sync::Arc, time::Instant};
use tower::Layer;
use tower_cookies::CookieManagerLayer;
use tower_http::normalize_path::NormalizePathLayer;
use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa_axum::router::OpenApiRouter;

mod cache;
mod captcha;
mod commands;
mod database;
mod deserialize;
mod env;
mod extract;
mod jwt;
mod mail;
mod models;
mod response;
mod routes;
mod settings;
mod utils;

#[cfg(target_os = "linux")]
#[global_allocator]
static ALLOC: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

const VERSION: &str = env!("CARGO_PKG_VERSION");
const GIT_COMMIT: &str = env!("CARGO_GIT_COMMIT");
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

pub type GetIp = axum::extract::Extension<std::net::IpAddr>;

async fn handle_request(
    connect_info: ConnectInfo<SocketAddr>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response<Body>, StatusCode> {
    let ip = crate::utils::extract_ip(req.headers()).unwrap_or_else(|| connect_info.ip());

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

    let env = env::Env::parse();

    match matches.subcommand() {
        Some(("version", sub_matches)) => std::process::exit(
            commands::version::version(sub_matches, env.as_ref().ok().map(|c| &c.0)).await,
        ),
        Some(("service-install", sub_matches)) => std::process::exit(
            commands::service_install::service_install(
                sub_matches,
                env.as_ref().ok().map(|c| &c.0),
            )
            .await,
        ),
        Some(("import", sub_matches)) => std::process::exit(
            commands::import::import(sub_matches, env.as_ref().ok().map(|c| &c.0)).await,
        ),
        Some(("diagnostics", sub_matches)) => std::process::exit(
            commands::diagnostics::diagnostics(sub_matches, env.as_ref().ok().map(|c| &c.0)).await,
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
                format!("{VERSION} (git-{GIT_COMMIT})")
            );
            tracing::info!("github.com/pterodactyl-rs/panel\n");
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
            release: Some(format!("{VERSION}:{GIT_COMMIT}").into()),
            traces_sample_rate: 1.0,
            ..Default::default()
        },
    ));

    let env = Arc::new(env);
    //let s3 = Arc::new(s3::S3::new(env.clone()).await);
    let jwt = Arc::new(jwt::Jwt::new(&env));
    let database = Arc::new(database::Database::new(&env).await);
    let cache = Arc::new(cache::Cache::new(&env).await);

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

    let settings = Arc::new(settings::Settings::new(database.clone()).await);
    let captcha = Arc::new(captcha::Captcha::new(settings.clone()));
    let mail = Arc::new(mail::Mail::new(settings.clone()));

    let state = Arc::new(routes::AppState {
        start_time: Instant::now(),
        version: format!("{VERSION}:{GIT_COMMIT}"),

        client: reqwest::ClientBuilder::new()
            .user_agent(format!("github.com/pterodactyl-rs/panel {VERSION}"))
            .build()
            .unwrap(),

        settings: settings.clone(),
        jwt,
        captcha,
        mail,
        database: database.clone(),
        cache: cache.clone(),
        env,
    });

    let app = OpenApiRouter::new()
        .merge(routes::router(&state))
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
            VERSION,
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
