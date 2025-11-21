use shared::extensions::commands::CliCommandGroupBuilder;

mod export;
mod inspect;
mod list;

pub fn commands(cli: CliCommandGroupBuilder) -> CliCommandGroupBuilder {
    cli.add_command(
        "list",
        "Lists the currently installed and pending Extensions for the Panel.",
        list::ListCommand,
    )
    .add_command(
        "inspect",
        "Inspects a .c7s.zip extension file for the Panel.",
        inspect::InspectCommand,
    )
    .add_command(
        "export",
        "Exports an extension using its identifier.",
        export::ExportCommand,
    )
}
