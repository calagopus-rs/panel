use anyhow::Context;
use clap::{Args, FromArgMatches};
use colored::Colorize;
use shared::extensions::distr::{ExtensionDistrFile, SlimExtensionDistrFile};
use std::path::Path;

#[derive(Args)]
pub struct UpdateArgs {
    #[arg(help = "the file to update an extension with")]
    file: String,
    #[arg(
        long = "skip-version-check",
        help = "whether to skip the panel version compatibility check (usually not recommended)",
        default_value = "false"
    )]
    skip_version_check: bool,
}

pub struct UpdateCommand;

impl shared::extensions::commands::CliCommand<UpdateArgs> for UpdateCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|_env, arg_matches| {
            Box::pin(async move {
                let args = UpdateArgs::from_arg_matches(&arg_matches)?;

                let file = tokio::fs::File::open(&args.file).await?.into_std().await;
                let mut extension_distr = tokio::task::spawn_blocking(move || {
                    ExtensionDistrFile::parse_from_file(file)
                        .context("failed to parse calagopus extension archive")
                })
                .await??;

                if !args.skip_version_check
                    && !extension_distr
                        .metadata_toml
                        .panel_version
                        .matches(&shared::VERSION.parse()?)
                {
                    eprintln!(
                        "{} {} {} {} {}",
                        "extension".red(),
                        extension_distr.metadata_toml.name.bright_red(),
                        "requires panel version".red(),
                        extension_distr
                            .metadata_toml
                            .panel_version
                            .to_string()
                            .bright_red(),
                        "but the current panel version is incompatible.".red()
                    );
                    std::process::exit(1);
                }

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

                if !installed_extensions.into_iter().any(|e| {
                    e.metadata_toml.package_name == extension_distr.metadata_toml.package_name
                }) {
                    eprintln!(
                        "{} {} {} {} {}",
                        "extension".red(),
                        extension_distr.metadata_toml.name.bright_red(),
                        "not installed - please use".red(),
                        format!("panel-rs extensions add {}", args.file).bright_red(),
                        "instead.".red()
                    );
                    std::process::exit(1);
                }

                let frontend_path = Path::new("frontend/extensions")
                    .join(extension_distr.metadata_toml.get_package_identifier());
                tokio::fs::remove_dir_all(&frontend_path).await?;
                tokio::fs::create_dir_all(&frontend_path).await?;
                let backend_path = Path::new("backend-extensions")
                    .join(extension_distr.metadata_toml.get_package_identifier());
                tokio::fs::remove_dir_all(&backend_path).await?;
                tokio::fs::create_dir_all(&backend_path).await?;
                let schema_path = Path::new("database/src/schema/extensions")
                    .join(extension_distr.metadata_toml.get_package_identifier() + ".ts");

                let extension_distr = tokio::task::spawn_blocking(move || {
                    extension_distr.extract_frontend(frontend_path)?;
                    extension_distr.extract_backend(backend_path)?;

                    if let Ok(schema) = extension_distr.get_schema() {
                        std::fs::write(schema_path, schema)?;
                    }

                    Ok::<_, anyhow::Error>(extension_distr)
                })
                .await??;

                println!(
                    "sucessfully updated {}",
                    extension_distr.metadata_toml.name.cyan(),
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
