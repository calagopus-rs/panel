use chrono::Datelike;
use clap::ArgMatches;

const TARGET: &str = env!("CARGO_TARGET");

pub async fn version(_matches: &ArgMatches, _env: Option<&crate::env::Env>) -> i32 {
    println!(
        "github.com/calagopus-rs/panel {}:{} ({TARGET})",
        crate::VERSION,
        crate::GIT_COMMIT
    );
    println!(
        "copyright © 2025 - {} 0x7d8 & Contributors",
        chrono::Local::now().year()
    );

    0
}
