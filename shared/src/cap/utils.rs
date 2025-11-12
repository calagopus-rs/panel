use std::{collections::VecDeque, path::PathBuf, sync::Arc};
use tokio::sync::{RwLock, Semaphore};

pub struct AsyncCapReadDir(
    pub Option<cap_std::fs::ReadDir>,
    pub Option<VecDeque<std::io::Result<(bool, String)>>>,
);

impl AsyncCapReadDir {
    async fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        if let Some(buffer) = self.1.as_mut()
            && !buffer.is_empty()
        {
            return buffer.pop_front();
        }

        let mut read_dir = self.0.take()?;
        let mut buffer = self.1.take()?;

        match tokio::task::spawn_blocking(move || {
            for _ in 0..32 {
                if let Some(entry) = read_dir.next() {
                    buffer.push_back(entry.map(|e| {
                        (
                            e.file_type().is_ok_and(|ft| ft.is_dir()),
                            e.file_name().to_string_lossy().to_string(),
                        )
                    }));
                } else {
                    break;
                }
            }

            (buffer, read_dir)
        })
        .await
        {
            Ok((buffer, read_dir)) => {
                self.0 = Some(read_dir);
                self.1 = Some(buffer);

                self.1.as_mut()?.pop_front()
            }
            Err(_) => None,
        }
    }
}

pub struct AsyncTokioReadDir(pub tokio::fs::ReadDir);

impl AsyncTokioReadDir {
    async fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        match self.0.next_entry().await {
            Ok(Some(entry)) => Some(Ok((
                entry.file_type().await.is_ok_and(|ft| ft.is_dir()),
                entry.file_name().to_string_lossy().to_string(),
            ))),
            Ok(None) => None,
            Err(err) => Some(Err(err)),
        }
    }
}

pub enum AsyncReadDir {
    Cap(AsyncCapReadDir),
    Tokio(AsyncTokioReadDir),
}

impl AsyncReadDir {
    pub async fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        match self {
            AsyncReadDir::Cap(read_dir) => read_dir.next_entry().await,
            AsyncReadDir::Tokio(read_dir) => read_dir.next_entry().await,
        }
    }
}

pub struct CapReadDir(pub cap_std::fs::ReadDir);

impl CapReadDir {
    pub fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        match self.0.next() {
            Some(Ok(entry)) => Some(Ok((
                entry.file_type().is_ok_and(|ft| ft.is_dir()),
                entry.file_name().to_string_lossy().to_string(),
            ))),
            Some(Err(err)) => Some(Err(err)),
            None => None,
        }
    }
}

pub struct StdReadDir(pub std::fs::ReadDir);

impl StdReadDir {
    pub fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        match self.0.next() {
            Some(Ok(entry)) => Some(Ok((
                entry.file_type().is_ok_and(|ft| ft.is_dir()),
                entry.file_name().to_string_lossy().to_string(),
            ))),
            Some(Err(err)) => Some(Err(err)),
            None => None,
        }
    }
}

pub enum ReadDir {
    Cap(CapReadDir),
    Std(StdReadDir),
}

impl ReadDir {
    pub fn next_entry(&mut self) -> Option<std::io::Result<(bool, String)>> {
        match self {
            ReadDir::Cap(read_dir) => read_dir.next_entry(),
            ReadDir::Std(read_dir) => read_dir.next_entry(),
        }
    }
}

pub struct AsyncWalkDir<'a> {
    cap_filesystem: super::CapFilesystem,
    stack: Vec<(PathBuf, AsyncReadDir)>,
    ignored: &'a [ignore::gitignore::Gitignore],
}

impl<'a> AsyncWalkDir<'a> {
    pub async fn new(
        cap_filesystem: super::CapFilesystem,
        path: PathBuf,
    ) -> Result<Self, anyhow::Error> {
        let read_dir = cap_filesystem.async_read_dir(&path).await?;

        Ok(Self {
            cap_filesystem,
            stack: vec![(path, read_dir)],
            ignored: &[],
        })
    }

    pub fn with_ignored(mut self, ignored: &'a [ignore::gitignore::Gitignore]) -> Self {
        self.ignored = ignored;
        self
    }

    pub async fn next_entry(&mut self) -> Option<Result<(bool, PathBuf), anyhow::Error>> {
        'stack: while let Some((parent_path, read_dir)) = self.stack.last_mut() {
            match read_dir.next_entry().await {
                Some(Ok((is_dir, name))) => {
                    let full_path = parent_path.join(&name);

                    let should_ignore = self
                        .ignored
                        .iter()
                        .any(|ignored| ignored.matched(&full_path, is_dir).is_ignore());
                    if crate::unlikely(should_ignore) {
                        continue 'stack;
                    }

                    if is_dir {
                        match self.cap_filesystem.async_read_dir(&full_path).await {
                            Ok(dir) => self.stack.push((full_path.clone(), dir)),
                            Err(e) => return Some(Err(e)),
                        };
                    }

                    return Some(Ok((is_dir, full_path)));
                }
                Some(Err(err)) => return Some(Err(err.into())),
                None => {
                    self.stack.pop();
                }
            }
        }

        None
    }

    pub async fn run_multithreaded<F, Fut>(
        &mut self,
        threads: usize,
        func: Arc<F>,
    ) -> Result<(), anyhow::Error>
    where
        F: Fn(bool, PathBuf) -> Fut + Send + Sync + 'static,
        Fut: futures_util::Future<Output = Result<(), anyhow::Error>> + Send + 'static,
    {
        let semaphore = Arc::new(Semaphore::new(threads));
        let error = Arc::new(RwLock::new(None));

        while let Some(entry) = self.next_entry().await {
            match entry {
                Ok((is_dir, path)) => {
                    let semaphore = Arc::clone(&semaphore);
                    let error = Arc::clone(&error);
                    let func = Arc::clone(&func);

                    if crate::unlikely(error.read().await.is_some()) {
                        break;
                    }

                    let permit = match semaphore.acquire_owned().await {
                        Ok(permit) => permit,
                        Err(_) => break,
                    };
                    tokio::spawn(async move {
                        let _permit = permit;
                        match func(is_dir, path).await {
                            Ok(_) => {}
                            Err(err) => {
                                *error.write().await = Some(err);
                            }
                        }
                    });
                }
                Err(err) => return Err(err),
            }
        }

        semaphore.acquire_many(threads as u32).await.ok();

        if let Some(err) = error.write().await.take() {
            return Err(err);
        }

        Ok(())
    }
}

pub struct WalkDir<'a> {
    cap_filesystem: super::CapFilesystem,
    stack: Vec<(PathBuf, ReadDir)>,
    ignored: &'a [ignore::gitignore::Gitignore],
}

impl<'a> WalkDir<'a> {
    pub fn new(cap_filesystem: super::CapFilesystem, path: PathBuf) -> Result<Self, anyhow::Error> {
        let read_dir = cap_filesystem.read_dir(&path)?;

        Ok(Self {
            cap_filesystem,
            stack: vec![(path, read_dir)],
            ignored: &[],
        })
    }

    pub fn with_ignored(mut self, ignored: &'a [ignore::gitignore::Gitignore]) -> Self {
        self.ignored = ignored;
        self
    }

    pub fn next_entry(&mut self) -> Option<Result<(bool, PathBuf), anyhow::Error>> {
        'stack: while let Some((parent_path, read_dir)) = self.stack.last_mut() {
            match read_dir.next_entry() {
                Some(Ok((is_dir, name))) => {
                    let full_path = parent_path.join(&name);

                    let should_ignore = self
                        .ignored
                        .iter()
                        .any(|ignored| ignored.matched(&full_path, is_dir).is_ignore());
                    if crate::unlikely(should_ignore) {
                        continue 'stack;
                    }

                    if is_dir {
                        match self.cap_filesystem.read_dir(&full_path) {
                            Ok(dir) => self.stack.push((full_path.clone(), dir)),
                            Err(e) => return Some(Err(e)),
                        };
                    }

                    return Some(Ok((is_dir, full_path)));
                }
                Some(Err(err)) => {
                    return Some(Err(err.into()));
                }
                None => {
                    self.stack.pop();
                }
            }
        }

        None
    }
}
