pub use crate::models::{
    BaseModel, ByUuid, DeletableModel, DeleteListenerList, Fetchable, ListenerList,
    ListenerPriority,
};

pub trait IteratorExtension<R, E>: Iterator<Item = Result<R, E>> {
    fn try_collect_vec(self) -> Result<Vec<R>, E>
    where
        Self: Sized,
    {
        let mut vec = Vec::new();

        let (_, hint_max) = self.size_hint();
        if let Some(hint_max) = hint_max {
            vec.reserve_exact(hint_max);
        }

        for item in self {
            vec.push(item?);
        }

        Ok(vec)
    }
}

impl<R, E, T: Iterator<Item = Result<R, E>>> IteratorExtension<R, E> for T {}

pub trait OptionExtension<T> {
    fn try_map<R, E, F: FnMut(T) -> Result<R, E>>(self, f: F) -> Result<Option<R>, E>;
}

impl<T> OptionExtension<T> for Option<T> {
    #[inline]
    fn try_map<R, E, F: FnMut(T) -> Result<R, E>>(self, mut f: F) -> Result<Option<R>, E> {
        match self {
            Some(item) => Ok(Some(f(item)?)),
            None => Ok(None),
        }
    }
}

#[async_trait::async_trait]
pub trait AsyncOptionExtension<T, Fut: Future<Output = T>> {
    async fn awaited(self) -> Option<T>;
}

#[async_trait::async_trait]
impl<T, Fut: Future<Output = T> + Send> AsyncOptionExtension<T, Fut> for Option<Fut> {
    #[inline]
    async fn awaited(self) -> Option<T> {
        match self {
            Some(item) => Some(item.await),
            None => None,
        }
    }
}

pub trait SqlxErrorExtension {
    fn is_unique_violation(&self) -> bool;
    fn is_foreign_key_violation(&self) -> bool;
    fn is_check_violation(&self) -> bool;
}

impl SqlxErrorExtension for sqlx::Error {
    #[inline]
    fn is_unique_violation(&self) -> bool {
        self.as_database_error()
            .is_some_and(|e| e.is_unique_violation())
    }

    #[inline]
    fn is_foreign_key_violation(&self) -> bool {
        self.as_database_error()
            .is_some_and(|e| e.is_foreign_key_violation())
    }

    #[inline]
    fn is_check_violation(&self) -> bool {
        self.as_database_error()
            .is_some_and(|e| e.is_check_violation())
    }
}
