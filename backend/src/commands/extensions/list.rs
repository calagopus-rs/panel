use clap::Args;
use colored::Colorize;
use shared::extensions::distr::SlimExtensionDistrFile;

#[derive(Args)]
pub struct ListArgs;

pub struct ListCommand;

impl shared::extensions::commands::CliCommand<ListArgs> for ListCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|_env, _arg_matches| {
            Box::pin(async move {
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
                let applied_extensions = extension_internal_list::list();

                for extension in &installed_extensions {
                    println!("{}", extension.cargo_toml.package.name.cyan().underline());
                    println!(
                        "  status:        {}",
                        if let Some(ext) = applied_extensions
                            .iter()
                            .find(|e| e.identifier == extension.identifier)
                        {
                            if ext.version == extension.cargo_toml.package.version {
                                "applied".green()
                            } else {
                                "applied - different version".yellow()
                            }
                        } else {
                            "not applied".red()
                        }
                    );
                    println!(
                        "  description:   {}",
                        extension.cargo_toml.package.description.cyan()
                    );
                    if let Some(first) = extension.cargo_toml.package.authors.first() {
                        let spaces = (extension.cargo_toml.package.authors.len() as f64)
                            .log10()
                            .floor() as usize
                            + 1;

                        println!(
                            "  authors ({}): {}{}",
                            extension.cargo_toml.package.authors.len(),
                            " ".repeat(3 - spaces),
                            first.cyan()
                        );
                        for author in extension.cargo_toml.package.authors.iter().skip(1) {
                            println!("                 {}", author.cyan());
                        }
                    }
                    println!(
                        "  version:       {}",
                        extension.cargo_toml.package.version.to_string().cyan()
                    );
                }

                Ok(())
            })
        })
    }
}
