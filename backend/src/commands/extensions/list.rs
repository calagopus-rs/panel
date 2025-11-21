use clap::Args;

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
                println!(
                    "github.com/calagopus-rs/panel {}:{} ({})",
                    shared::VERSION,
                    shared::GIT_COMMIT,
                    shared::TARGET
                );

                Ok(())
            })
        })
    }
}
