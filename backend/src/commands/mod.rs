use shared::extensions::commands::CliCommandGroupBuilder;

mod diagnostics;
mod extensions;
mod import;
mod service_install;
mod version;

pub fn commands(cli: CliCommandGroupBuilder) -> CliCommandGroupBuilder {
    cli.add_command(
        "version",
        "Prints the current executable version and exits.",
        version::VersionCommand,
    )
    .add_command(
        "service-install",
        "Installs the Panel service on the system.",
        service_install::ServiceInstallCommand,
    )
    .add_command(
        "diagnostics",
        "Gets Diagnostic Data for the Panel.",
        diagnostics::DiagnosticsCommand,
    )
    .add_command(
        "import",
        "Imports Data from a Pterodactyl Instance to the Panel.",
        import::ImportCommand,
    )
    .add_group(
        "extensions",
        "Manage Extensions for the Panel.",
        extensions::commands,
    )
}
