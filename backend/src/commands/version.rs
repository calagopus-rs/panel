use chrono::Datelike;
use clap::ArgMatches;

pub async fn version(_matches: &ArgMatches, _env: Option<&shared::env::Env>) -> i32 {
    println!(
        "github.com/calagopus-rs/panel {}:{} ({})",
        shared::VERSION,
        shared::GIT_COMMIT,
        shared::TARGET
    );
    println!(
        "copyright © 2025 - {} 0x7d8 & Contributors",
        chrono::Local::now().year()
    );

    0
}
