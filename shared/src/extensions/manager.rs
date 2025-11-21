use std::sync::Arc;

use tokio::sync::{RwLock, RwLockReadGuard};

use crate::{
    State,
    extensions::{ConstructedExtension, ExtensionRouteBuilder, commands::CliCommandGroupBuilder},
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

    pub async fn init_cli(
        &self,
        env: Option<&Arc<crate::env::Env>>,
        mut builder: CliCommandGroupBuilder,
    ) -> CliCommandGroupBuilder {
        for ext in self.vec.write().await.iter_mut() {
            builder = ext.initialize_cli(env, builder).await;
        }

        builder
    }

    #[inline]
    pub async fn extensions(&self) -> RwLockReadGuard<'_, Vec<ConstructedExtension>> {
        self.vec.read().await
    }

    pub async fn call(
        &self,
        name: impl AsRef<str>,
        args: &[super::ExtensionCallValue],
    ) -> Option<super::ExtensionCallValue> {
        for ext in self.extensions().await.iter() {
            if let Some(ret) = ext.process_call(name.as_ref(), args).await {
                return Some(ret);
            }
        }

        None
    }
}
