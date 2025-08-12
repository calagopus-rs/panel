use clap::ArgMatches;
use colored::Colorize;
use dialoguer::{Confirm, theme::ColorfulTheme};
use serde::Deserialize;
use std::{collections::VecDeque, fmt::Write, path::Path};
use tokio::{fs::File, io::AsyncBufReadExt};

pub async fn diagnostics(matches: &ArgMatches, env: Option<&crate::env::Env>) -> i32 {
    let log_lines = *matches.get_one::<usize>("log_lines").unwrap();

    let env = match env {
        Some(env) => env,
        None => {
            eprintln!("{}", "no env found".red());
            return 1;
        }
    };

    let review_before_upload = Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt("do you want to review the collected data before uploading to pastes.dev?")
        .default(true)
        .interact()
        .unwrap();

    let mut output = String::with_capacity(1024);
    writeln!(output, "panel-rs - diagnostics report").unwrap();

    write_header(&mut output, "versions");
    write_line(
        &mut output,
        "panel-rs",
        &format!("{}:{}", crate::VERSION, crate::GIT_COMMIT),
    );
    write_line(&mut output, "target", env!("CARGO_TARGET"));
    write_line(&mut output, "os", std::env::consts::OS);

    write_header(&mut output, "panel-rs configuration");
    write_line(
        &mut output,
        "internal webserver",
        &format!("{} : {}", env.bind, env.port),
    );
    write_line(&mut output, "logs directory", &env.app_log_directory);
    writeln!(output).unwrap();
    write_line(&mut output, "redis mode", &format!("{:?}", env.redis_mode));
    write_line(
        &mut output,
        "sentry url set",
        &env.sentry_url.is_some().to_string(),
    );
    write_line(
        &mut output,
        "sqlx database migrations",
        &env.database_migrate.to_string(),
    );
    writeln!(output).unwrap();
    write_line(
        &mut output,
        "server time",
        &format!("{}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S")),
    );
    write_line(
        &mut output,
        "timezone",
        &format!("{}", chrono::Local::now().offset()),
    );
    write_line(&mut output, "debug mode", &env.app_debug.to_string());

    write_header(&mut output, "latest panel-rs logs");
    match File::open(Path::new(&env.app_log_directory).join("panel.log")).await {
        Ok(file) => {
            let mut reader = tokio::io::BufReader::new(file);
            let mut all_lines = VecDeque::new();
            let mut line = String::new();
            all_lines.reserve_exact(log_lines);

            while match reader.read_line(&mut line).await {
                Ok(n) => n,
                Err(err) => {
                    eprintln!("{}: {err}", "failed to read wings log file".red());
                    return 1;
                }
            } > 0
            {
                if !line.trim().is_empty() {
                    if all_lines.len() == log_lines {
                        all_lines.pop_front();
                    }
                    all_lines.push_back(line.clone());
                }
                line.clear();
            }

            for line in all_lines {
                let mut result_line = String::new();
                let mut chars = line.chars().peekable();

                while let Some(c) = chars.next() {
                    if c == '\u{1b}' {
                        while let Some(&next) = chars.peek() {
                            chars.next();

                            if next.is_ascii_alphabetic() {
                                break;
                            }
                        }
                    } else {
                        result_line.push(c);
                    }
                }

                write!(output, "{result_line}").unwrap();
            }
        }
        Err(err) => {
            eprintln!("{}: {err}", "failed to read wings log file".red());
            return 1;
        }
    }

    println!("{output}");

    if review_before_upload {
        let confirm = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt("do you want to upload the diagnostics report to pastes.dev?")
            .default(true)
            .interact()
            .unwrap();

        if !confirm {
            return 0;
        }
    }

    let client = reqwest::Client::new();
    let response = match client
        .post("https://api.pastes.dev/post")
        .header(
            "User-Agent",
            format!("wings-rs diagnostics/v{}", crate::VERSION),
        )
        .header("Content-Type", "text/plain")
        .header("Accept", "application/json")
        .body(output)
        .send()
        .await
    {
        Ok(response) => response,
        Err(err) => {
            eprintln!("{}: {err}", "failed to upload diagnostics report".red());
            return 1;
        }
    };
    let response: Response = match response.json().await {
        Ok(response) => response,
        Err(err) => {
            eprintln!(
                "{}: {err}",
                "failed to parse response from pastes.dev".red()
            );
            return 1;
        }
    };

    #[derive(Deserialize)]
    struct Response {
        key: String,
    }

    println!(
        "uploaded diagnostics report to https://pastes.dev/{}",
        response.key
    );

    0
}

#[inline]
fn write_header(output: &mut String, name: &str) {
    writeln!(output, "\n|\n| {name}").unwrap();
    writeln!(output, "| ------------------------------").unwrap();
}

#[inline]
fn write_line(output: &mut String, name: &str, value: &str) {
    writeln!(output, "{name:>20}: {value}").unwrap();
}
