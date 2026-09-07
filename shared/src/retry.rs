use std::{
    sync::LazyLock,
    time::{Duration, Instant},
};

const STARTUP_BUDGET: Duration = Duration::from_secs(10);
const INITIAL_BACKOFF: Duration = Duration::from_millis(250);
const MAX_BACKOFF: Duration = Duration::from_secs(2);

static STARTUP_DEADLINE: LazyLock<Instant> = LazyLock::new(|| Instant::now() + STARTUP_BUDGET);

pub async fn startup_connect<
    T,
    E: std::fmt::Display,
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, E>>,
>(
    label: &str,
    mut attempt: F,
) -> T {
    let deadline = *STARTUP_DEADLINE;
    let mut backoff = INITIAL_BACKOFF;

    loop {
        let err = match attempt().await {
            Ok(value) => return value,
            Err(err) => err,
        };

        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            return crate::utils::handle_startup_error(anyhow::anyhow!(
                "connecting to the {label} failed: {err}"
            ));
        }

        let wait = backoff.min(remaining);
        tracing::warn!(
            "connecting to the {label} failed ({err}), retrying in {:.2}s",
            wait.as_secs_f64()
        );

        tokio::time::sleep(wait).await;
        backoff = (backoff * 2).min(MAX_BACKOFF);
    }
}
