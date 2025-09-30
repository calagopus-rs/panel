use clap::ArgMatches;
use colored::Colorize;
use std::path::Path;
use tokio::process::Command;

pub async fn service_install(matches: &ArgMatches, env: Option<&shared::env::Env>) -> i32 {
    let r#override = *matches.get_one::<bool>("override").unwrap();

    if std::env::consts::OS != "linux" {
        eprintln!("{}", "this command is only available on Linux".red());
        return 1;
    }

    let binary = match std::env::current_exe() {
        Ok(path) => path,
        Err(_) => {
            eprintln!("{}", "failed to get current executable path".red());
            return 1;
        }
    };

    if tokio::fs::metadata("/etc/systemd/system").await.is_err() {
        eprintln!("{}", "systemd directory does not exist".red());
        return 1;
    }

    let service_path = Path::new("/etc/systemd/system/panel.service");
    if tokio::fs::metadata(service_path).await.is_ok() && !r#override {
        eprintln!("{}", "service file already exists".red());
        return 1;
    }

    let service_content = format!(
        "[Unit]
Description=Pterodactyl Panel Daemon

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/panel/daemon.pid
ExecStart={}
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
",
        binary.display()
    );

    match tokio::fs::write(service_path, service_content).await {
        Ok(_) => {
            println!("service file created successfully");

            if let Err(err) = Command::new("systemctl")
                .arg("daemon-reload")
                .output()
                .await
            {
                eprintln!("{}: {err}", "failed to reload systemd".red());
                return 1;
            }

            println!("systemd reloaded successfully");

            if let Err(err) = Command::new("systemctl")
                .arg("enable")
                .args(if env.is_some() {
                    &["--now"]
                } else {
                    &[] as &[&str]
                })
                .arg("panel.service")
                .output()
                .await
            {
                eprintln!("{}: {err}", "failed to enable service".red());
                return 1;
            }

            if env.is_some() {
                println!("service file enabled on startup and started");
            } else {
                println!("service file enabled on startup")
            }

            0
        }
        Err(err) => {
            eprintln!("{}: {err}", "failed to write service file".red());

            1
        }
    }
}
