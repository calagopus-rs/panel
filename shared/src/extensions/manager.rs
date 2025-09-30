use tokio::sync::{RwLock, RwLockReadGuard};

use crate::{
    State,
    extensions::{ConstructedExtension, ExtensionRouteBuilder},
};

pub struct ExtensionManager {
    vec: RwLock<Vec<ConstructedExtension>>,
}

impl ExtensionManager {
    pub fn new(vec: Vec<ConstructedExtension>) -> Self {
        Self {
            vec: RwLock::new(vec),
        }
    }

    pub async fn init(&self, state: State) -> ExtensionRouteBuilder {
        let mut builder = ExtensionRouteBuilder::new(state.clone());

        for ext in self.vec.write().await.iter_mut() {
            ext.initialize(state.clone()).await;

            builder = ext.initialize_router(state.clone(), builder).await;
        }

        builder
    }

    #[inline]
    pub async fn extensions(&self) -> RwLockReadGuard<'_, Vec<ConstructedExtension>> {
        self.vec.read().await
    }

    #[inline]
    pub async fn call(
        &self,
        name: impl AsRef<str>,
        args: &[Box<dyn std::any::Any>],
    ) -> Option<Box<dyn std::any::Any>> {
        for ext in self.extensions().await.iter() {
            if let Some(ret) = ext.process_call(name.as_ref(), args).await {
                return Some(ret);
            }
        }

        None
    }
}
