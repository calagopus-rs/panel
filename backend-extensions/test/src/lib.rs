use shared::extensions::Extension;

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, state: shared::State) {
        println!("HELLO HELLO");
    }
}
