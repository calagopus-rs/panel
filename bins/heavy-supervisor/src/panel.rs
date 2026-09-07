use crate::group::Group;
use anyhow::Context;
use rustix::process::Signal;
use std::{process::ExitStatus, time::Duration};

const DEFAULT_STARTUP_PROBE: Duration = Duration::from_secs(15);
const DEFAULT_BACKOFF_BASE: Duration = Duration::from_secs(1);
const DEFAULT_BACKOFF_FACTOR: u32 = 4;
const DEFAULT_START_RETRIES: u32 = 3;
const DEFAULT_FAILURE_LIMIT: u32 = 5;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Policy {
    pub startup_probe: Duration,
    pub backoff_base: Duration,
    pub backoff_factor: u32,
    pub start_retries: u32,
    pub failure_limit: u32,
}

impl Default for Policy {
    fn default() -> Self {
        Self {
            startup_probe: DEFAULT_STARTUP_PROBE,
            backoff_base: DEFAULT_BACKOFF_BASE,
            backoff_factor: DEFAULT_BACKOFF_FACTOR,
            start_retries: DEFAULT_START_RETRIES,
            failure_limit: DEFAULT_FAILURE_LIMIT,
        }
    }
}

impl Policy {
    pub fn backoff(&self, attempt: u32) -> Duration {
        let step = attempt.clamp(1, self.start_retries.max(1)) - 1;

        self.backoff_base
            .checked_mul(self.backoff_factor.saturating_pow(step))
            .unwrap_or(Duration::MAX)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    Started,
    StartFailed,
    Crashed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Continue,
    Retry { after: Duration },
    FallBack,
    GiveUp,
}

#[derive(Debug)]
pub struct Supervision {
    policy: Policy,
    attempt: u32,
    consecutive_failures: u32,
    fallback_allowed: bool,
    fell_back: bool,
}

impl Supervision {
    pub fn new(policy: Policy, fallback_allowed: bool) -> Self {
        Self {
            policy,
            attempt: 0,
            consecutive_failures: 0,
            fallback_allowed,
            fell_back: false,
        }
    }

    pub fn policy(&self) -> &Policy {
        &self.policy
    }

    pub fn consecutive_failures(&self) -> u32 {
        self.consecutive_failures
    }

    pub fn record(&mut self, outcome: Outcome) -> Decision {
        match outcome {
            Outcome::Started => {
                self.attempt = 0;
                self.consecutive_failures = 0;

                Decision::Continue
            }
            Outcome::Crashed => Decision::Retry {
                after: self.policy.backoff(self.attempt.saturating_add(1)),
            },
            Outcome::StartFailed => {
                self.attempt = self.attempt.saturating_add(1);
                self.consecutive_failures = self.consecutive_failures.saturating_add(1);

                if self.consecutive_failures >= self.policy.failure_limit {
                    return Decision::GiveUp;
                }

                if self.attempt <= self.policy.start_retries
                    || self.fell_back
                    || !self.fallback_allowed
                {
                    return Decision::Retry {
                        after: self.policy.backoff(self.attempt),
                    };
                }

                self.fell_back = true;
                self.attempt = 0;

                Decision::FallBack
            }
        }
    }
}

#[derive(Debug)]
pub enum Startup {
    Alive,
    ExitedEarly(ExitStatus),
}

#[derive(Debug)]
pub enum Stop {
    Graceful,
    Killed,
    Unresponsive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Shutdown {
    pub grace: Duration,
    pub reap_bound: Duration,
}

impl Shutdown {
    pub fn new(grace: Duration) -> Self {
        Self {
            grace,
            reap_bound: crate::group::REAP_BOUND,
        }
    }
}

pub enum StartOutcome {
    Running(PanelProcess),
    Interrupted(Option<PanelProcess>),
    FallBack(String),
    GiveUp(String),
}

pub struct PanelProcess {
    child: tokio::process::Child,
    group: Group,
}

impl PanelProcess {
    pub fn spawn(command: &mut tokio::process::Command) -> anyhow::Result<Self> {
        let mut child = command
            .process_group(0)
            .kill_on_drop(true)
            .spawn()
            .context("spawning the panel")?;

        match Group::of(&child).context("the panel reported no usable pid") {
            Ok(group) => Ok(Self { child, group }),
            Err(err) => {
                let _ = child.start_kill();

                Err(err)
            }
        }
    }

    pub async fn probe(&mut self, window: Duration) -> anyhow::Result<Startup> {
        match tokio::time::timeout(window, self.child.wait()).await {
            Ok(status) => Ok(Startup::ExitedEarly(
                status.context("waiting for the panel")?,
            )),
            Err(_) => Ok(Startup::Alive),
        }
    }

    pub async fn wait(&mut self) -> anyhow::Result<ExitStatus> {
        let status = self.child.wait().await.context("waiting for the panel")?;
        self.sweep_group();

        Ok(status)
    }

    pub async fn stop(&mut self, shutdown: Shutdown) -> Stop {
        if let Err(err) = self.signal_group(Signal::TERM) {
            tracing::warn!("{err:#}");
        }

        if matches!(
            tokio::time::timeout(shutdown.grace, self.child.wait()).await,
            Ok(Ok(_))
        ) {
            self.sweep_group();

            return Stop::Graceful;
        }

        tracing::warn!(
            "the panel did not exit within {} seconds of SIGTERM, killing it",
            shutdown.grace.as_secs_f64()
        );

        if let Err(err) = self.signal_group(Signal::KILL) {
            tracing::warn!("{err:#}");
        }

        let killed = tokio::time::timeout(shutdown.reap_bound, self.child.wait()).await;
        self.sweep_group();

        match killed {
            Ok(Ok(_)) => Stop::Killed,
            Ok(Err(err)) => {
                tracing::warn!("the panel's exit status could not be collected: {err}");

                Stop::Unresponsive
            }
            Err(_) => Stop::Unresponsive,
        }
    }

    fn sweep_group(&mut self) {
        self.group.sweep();
    }

    fn signal_group(&self, signal: Signal) -> anyhow::Result<()> {
        self.group
            .signal(signal)
            .context("signaling the panel's process group")
    }
}

impl Drop for PanelProcess {
    fn drop(&mut self) {
        let _ = self.signal_group(Signal::KILL);
    }
}

pub async fn start(
    mut command: impl FnMut() -> tokio::process::Command,
    supervision: &mut Supervision,
    interrupt: &mut (impl Future<Output = ()> + Unpin),
) -> StartOutcome {
    loop {
        let failure = match PanelProcess::spawn(&mut command()) {
            Ok(mut panel) => {
                let probed = tokio::select! {
                    probed = panel.probe(supervision.policy().startup_probe) => Some(probed),
                    () = &mut *interrupt => None,
                };

                let Some(probed) = probed else {
                    return StartOutcome::Interrupted(Some(panel));
                };

                let reason = match probed {
                    Ok(Startup::Alive) => {
                        supervision.record(Outcome::Started);

                        return StartOutcome::Running(panel);
                    }
                    Ok(Startup::ExitedEarly(status)) => {
                        format!("the panel exited with {status} during startup")
                    }
                    Err(err) => format!("{err:#}"),
                };

                panel.sweep_group();

                reason
            }
            Err(err) => format!("{err:#}"),
        };

        tracing::warn!("panel start failed: {failure}");

        match supervision.record(Outcome::StartFailed) {
            Decision::Retry { after } => {
                tokio::select! {
                    () = tokio::time::sleep(after) => {}
                    () = &mut *interrupt => return StartOutcome::Interrupted(None),
                }
            }
            Decision::FallBack => return StartOutcome::FallBack(failure),
            Decision::GiveUp | Decision::Continue => return StartOutcome::GiveUp(failure),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn policy() -> Policy {
        Policy {
            startup_probe: Duration::from_secs(1),
            backoff_base: Duration::from_secs(1),
            backoff_factor: 4,
            start_retries: 3,
            failure_limit: 5,
        }
    }

    #[test]
    fn falls_back_after_the_start_retries() {
        let mut supervision = Supervision::new(policy(), true);

        for expected in [1, 4, 16] {
            assert_eq!(
                supervision.record(Outcome::StartFailed),
                Decision::Retry {
                    after: Duration::from_secs(expected)
                }
            );
        }
        assert_eq!(supervision.record(Outcome::StartFailed), Decision::FallBack);
        assert_eq!(supervision.record(Outcome::StartFailed), Decision::GiveUp);
    }

    #[test]
    fn never_falls_back_when_disallowed() {
        let mut supervision = Supervision::new(policy(), false);

        for expected in [1, 4, 16, 16] {
            assert_eq!(
                supervision.record(Outcome::StartFailed),
                Decision::Retry {
                    after: Duration::from_secs(expected)
                }
            );
        }
        assert_eq!(supervision.record(Outcome::StartFailed), Decision::GiveUp);
    }

    #[test]
    fn a_successful_start_resets_the_counters() {
        let mut supervision = Supervision::new(policy(), false);

        supervision.record(Outcome::StartFailed);
        supervision.record(Outcome::StartFailed);
        assert_eq!(supervision.record(Outcome::Started), Decision::Continue);
        assert_eq!(supervision.consecutive_failures(), 0);
        assert_eq!(
            supervision.record(Outcome::StartFailed),
            Decision::Retry {
                after: Duration::from_secs(1)
            }
        );
    }
}
