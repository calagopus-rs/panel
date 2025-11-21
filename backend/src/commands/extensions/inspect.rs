use clap::{Args, FromArgMatches};
use colored::Colorize;

#[derive(Args)]
pub struct InspectArgs {
    #[arg(help = "the file to inspect")]
    file: String,
}

pub struct InspectCommand;

impl shared::extensions::commands::CliCommand<InspectArgs> for InspectCommand {
    fn get_command(&self, command: clap::Command) -> clap::Command {
        command
    }

    fn get_executor(self) -> Box<shared::extensions::commands::ExecutorFunc> {
        Box::new(|_env, arg_matches| {
            Box::pin(async move {
                let args = InspectArgs::from_arg_matches(&arg_matches)?;

                let file = std::fs::File::open(args.file)?;
                let metadata = file.metadata()?;
                let extension_distr =
                    shared::extensions::distr::ExtensionDistrFile::parse_from_file(file)?;

                println!(
                    "{}",
                    extension_distr.backend_package.name.cyan().underline()
                );
                println!(
                    "  status:        {}",
                    if let Some(ext) = extension_internal_list::list()
                        .into_iter()
                        .find(|e| e.identifier == extension_distr.identifier)
                    {
                        if ext.version() == extension_distr.backend_package.version {
                            "installed".green()
                        } else {
                            "installed - different version".yellow()
                        }
                    } else {
                        "not installed".red()
                    }
                );
                if let Some(description) = &extension_distr.backend_package.description {
                    println!("  description:   {}", description.cyan());
                }
                if let Some(authors) = &extension_distr.backend_package.authors
                    && let Some(first) = authors.first()
                {
                    let spaces = (authors.len() as f64).log10().floor() as usize + 1;

                    println!(
                        "  authors ({}): {}{}",
                        authors.len(),
                        " ".repeat(3 - spaces),
                        first.cyan()
                    );
                    for author in authors.iter().skip(1) {
                        println!("                 {}", author.cyan());
                    }
                }
                println!(
                    "  version:       {}",
                    extension_distr.backend_package.version.cyan()
                );
                println!(
                    "  packed size:   {}",
                    human_bytes::human_bytes(metadata.len() as f64).cyan()
                );
                println!(
                    "  unpacked size: {} ({:.2}%)",
                    human_bytes::human_bytes(extension_distr.total_size() as f64).cyan(),
                    ((extension_distr.total_size() as f64 / metadata.len() as f64) - 1.0) * 100.0
                );

                println!("  frontend:");
                if let Some((dep, version)) = extension_distr
                    .frontend_package
                    .dependencies
                    .first_key_value()
                {
                    let spaces = (extension_distr.frontend_package.dependencies.len() as f64)
                        .log10()
                        .floor() as usize
                        + 1;

                    println!(
                        "    dependencies ({}): {}@{}",
                        extension_distr.frontend_package.dependencies.len(),
                        dep.cyan(),
                        version.cyan()
                    );
                    for (dep, version) in
                        extension_distr.frontend_package.dependencies.iter().skip(1)
                    {
                        println!(
                            "{}                     {}@{}",
                            " ".repeat(spaces),
                            dep.cyan(),
                            version.cyan()
                        );
                    }
                } else {
                    println!("    dependencies (0)");
                }

                Ok(())
            })
        })
    }
}
