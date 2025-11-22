use std::path::Path;

use anyhow::Context;
use clap::{Args, FromArgMatches};
use colored::Colorize;
use shared::extensions::distr::{ExtensionDistrFile, SlimExtensionDistrFile};

#[derive(Args)]
pub struct AddArgs {
    #[arg(help = "the file to add as an extension")]
    file: String,
}

pub struct AddCommand;

impl shared::extensions::commands::CliCommand<AddArgs> for AddCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|_env, arg_matches| {
            Box::pin(async move {
                let args = AddArgs::from_arg_matches(&arg_matches)?;

                let file = tokio::fs::File::open(&args.file).await?.into_std().await;
                let mut extension_distr = tokio::task::spawn_blocking(move || {
                    ExtensionDistrFile::parse_from_file(file)
                        .context("failed to parse calagopus extension archive")
                })
                .await??;

                if tokio::fs::metadata(".sqlx")
                    .await
                    .ok()
                    .is_none_or(|e| !e.is_dir())
                {
                    eprintln!(
                        "{} {} {}",
                        "failed to find".red(),
                        ".sqlx".bright_red(),
                        "directory, make sure you are in the panel root.".red()
                    );
                    std::process::exit(1);
                }

                let installed_extensions = tokio::task::spawn_blocking(move || {
                    SlimExtensionDistrFile::parse_from_directory(".")
                })
                .await??;

                if let Some(ext) = installed_extensions
                    .into_iter()
                    .find(|e| e.identifier == extension_distr.identifier)
                {
                    eprintln!(
                        "{} {} {} {} {} {} {}",
                        "extension".red(),
                        ext.cargo_toml.package.name.bright_red(),
                        "already installed with version".red(),
                        ext.cargo_toml.package.version.to_string().bright_red(),
                        "- please use".red(),
                        format!("panel-rs extensions update {}", args.file).bright_red(),
                        "instead.".red()
                    );
                    std::process::exit(1);
                }

                let frontend_path =
                    Path::new("frontend/extensions").join(&extension_distr.identifier);
                tokio::fs::create_dir_all(&frontend_path).await?;
                let backend_path =
                    Path::new("backend-extensions").join(&extension_distr.identifier);
                tokio::fs::create_dir_all(&backend_path).await?;

                let extension_distr = tokio::task::spawn_blocking(move || {
                    extension_distr.extract_frontend(frontend_path)?;
                    extension_distr.extract_backend(backend_path)?;

                    Ok::<_, anyhow::Error>(extension_distr)
                })
                .await??;

                println!(
                    "sucessfully added {}",
                    extension_distr.cargo_toml.package.name.cyan(),
                );
                println!(
                    "make sure to run {} to apply its changes",
                    "panel-rs extensions apply".bright_black(),
                );

                Ok(())
            })
        })
    }
}
