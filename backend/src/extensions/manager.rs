use crate::{
    extensions::{Extension, ExtensionRouteBuilder},
    routes::State,
};

pub struct ConstructedExtension {
    name: &'static str,
    description: &'static str,
    author: &'static str,

    extension: Box<dyn Extension>,
}

impl ConstructedExtension {
    /// Gets the display name of the extension defined by the author
    #[inline]
    pub const fn name(&self) -> &'static str {
        self.name
    }

    /// Gets the description of the extension defined by the author
    #[inline]
    pub const fn description(&self) -> &'static str {
        self.description
    }

    /// Gets the author name of the extension defined by the author
    #[inline]
    pub const fn author(&self) -> &'static str {
        self.author
    }
}

pub struct ExtensionManager {
    vec: Vec<ConstructedExtension>,
}

impl ExtensionManager {
    pub async fn new(state: State) -> (ExtensionRouteBuilder, Self) {
        let mut vec = super::list::list();
        let mut builder = ExtensionRouteBuilder::new(state.clone());

        for ext in vec.iter_mut() {
            ext.extension.initialize(state.clone()).await;

            builder = ext
                .extension
                .initialize_router(state.clone(), builder)
                .await;
        }

        (builder, Self { vec })
    }

    #[inline]
    pub const fn extensions(&self) -> &[ConstructedExtension] {
        self.vec.as_slice()
    }

    #[inline]
    pub async fn call(
        &self,
        name: impl AsRef<str>,
        args: &[Box<dyn std::any::Any>],
    ) -> Option<Box<dyn std::any::Any>> {
        for ext in self.extensions() {
            if let Some(ret) = ext.extension.process_call(name.as_ref(), args).await {
                return Some(ret);
            }
        }

        None
    }
}
