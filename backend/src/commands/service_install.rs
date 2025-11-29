use clap::{Args, FromArgMatches};
use colored::Colorize;
use std::path::Path;
use tokio::process::Command;

#[derive(Args)]
pub struct ServiceInstallArgs {
    #[arg(
        short = 'o',
        long = "override",
        help = "set to true to override an existing service file"
    )]
    r#override: bool,
}

pub struct ServiceInstallCommand;

impl shared::extensions::commands::CliCommand<ServiceInstallArgs> for ServiceInstallCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|env, arg_matches| {
            Box::pin(async move {
                let args = ServiceInstallArgs::from_arg_matches(&arg_matches)?;

                if std::env::consts::OS != "linux" {
                    eprintln!("{}", "this command is only available on Linux".red());
                    std::process::exit(1);
                }

                let binary = match std::env::current_exe() {
                    Ok(path) => path,
                    Err(_) => {
                        eprintln!("{}", "failed to get current executable path".red());
                        std::process::exit(1);
                    }
                };

                if tokio::fs::metadata("/etc/systemd/system").await.is_err() {
                    eprintln!("{}", "systemd directory does not exist".red());
                    std::process::exit(1);
                }

                let service_path = Path::new("/etc/systemd/system/calagopus-panel.service");
                if tokio::fs::metadata(service_path).await.is_ok() && !args.r#override {
                    eprintln!("{}", "service file already exists".red());
                    std::process::exit(1);
                }

                let service_content = format!(
                    "[Unit]
Description=Calagopus Panel Daemon

[Service]
User=root
WorkingDirectory=/etc/calagopus
LimitNOFILE=4096
PIDFile=/var/run/calagopus-panel/daemon.pid
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
                            std::process::exit(1);
                        }

                        println!("systemd reloaded successfully");

                        if let Err(err) = Command::new("systemctl")
                            .arg("enable")
                            .args(if env.is_some() {
                                &["--now"]
                            } else {
                                &[] as &[&str]
                            })
                            .arg("calagopus-panel.service")
                            .output()
                            .await
                        {
                            eprintln!("{}: {err}", "failed to enable service".red());
                            std::process::exit(1);
                        }

                        if env.is_some() {
                            println!("service file enabled on startup and started");
                        } else {
                            println!("service file enabled on startup")
                        }
                    }
                    Err(err) => {
                        eprintln!("{}: {err}", "failed to write service file".red());
                        std::process::exit(1);
                    }
                }

                Ok(())
            })
        })
    }
}
