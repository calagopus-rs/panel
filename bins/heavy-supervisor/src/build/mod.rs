use crate::{
    config::Config,
    store::record::{BuildRecord, BuildState},
};
use anyhow::Context;
use shared::heavy::BuildPhase;
use std::{
    collections::BTreeSet,
    path::{Path, PathBuf},
    time::Duration,
};

mod runner;
mod verify;

pub use runner::{Cancellation, CommandRunner, ProcessRunner};

pub const REPO_DIRTY_MARKER: &str = ".heavy-repo-dirty";

const INTERNAL_LIST: &str = "internal-list";
const CARGO_MANIFEST: &str = "Cargo.toml";
const CARGO_TEMPLATE: &str = "Cargo.template.toml";

const NODE_HEAP_MB: u32 = 2048;

const LIST_TIMEOUT: Duration = Duration::from_secs(60);
const FRONTEND_KEEP: [&str; 2] = ["shared", "tsconfig.json"];

pub fn repo_dirty_marker(repo_dir: &Path) -> PathBuf {
    repo_dir.join(REPO_DIRTY_MARKER)
}

pub fn repo_is_dirty(repo_dir: &Path) -> bool {
    repo_dirty_marker(repo_dir).exists()
}

pub fn mark_repo_dirty(repo_dir: &Path) -> anyhow::Result<()> {
    let marker = repo_dirty_marker(repo_dir);

    std::fs::write(&marker, b"").with_context(|| format!("writing {}", marker.display()))
}

pub fn clear_repo_dirty(repo_dir: &Path) -> anyhow::Result<()> {
    let marker = repo_dirty_marker(repo_dir);

    match std::fs::remove_file(&marker) {
        Err(err) if err.kind() != std::io::ErrorKind::NotFound => {
            Err(err).with_context(|| format!("removing {}", marker.display()))
        }
        _ => Ok(()),
    }
}

pub fn reset_repo(repo_dir: &Path) -> anyhow::Result<()> {
    let backend = repo_dir.join("backend-extensions");
    remove_children(&backend, &[INTERNAL_LIST])?;
    remove_children(
        &repo_dir.join("frontend").join("extensions"),
        &FRONTEND_KEEP,
    )?;

    let internal_list = backend.join(INTERNAL_LIST);
    let template = internal_list.join(CARGO_TEMPLATE);
    std::fs::copy(&template, internal_list.join(CARGO_MANIFEST))
        .with_context(|| format!("restoring {CARGO_MANIFEST} from {}", template.display()))?;

    Ok(())
}

fn remove_children(dir: &Path, keep: &[&str]) -> anyhow::Result<()> {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(err).with_context(|| format!("reading {}", dir.display())),
    };

    for entry in entries {
        let entry = entry?;
        if keep.iter().any(|name| entry.file_name() == *name) {
            continue;
        }

        remove_entry(&entry.path())?;
    }

    Ok(())
}

fn remove_entry(path: &Path) -> anyhow::Result<()> {
    let metadata = std::fs::symlink_metadata(path)
        .with_context(|| format!("inspecting {}", path.display()))?;

    let removed = if metadata.is_dir() {
        std::fs::remove_dir_all(path)
    } else {
        std::fs::remove_file(path)
    };

    removed.with_context(|| format!("removing {}", path.display()))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepKind {
    Clear,
    Add,
    Resync,
    ListInstalled,
    Apply,
    VerifyList,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StepCommand {
    pub kind: StepKind,
    pub program: PathBuf,
    pub args: Vec<String>,
    pub cwd: PathBuf,
    pub env: Vec<(String, String)>,
    pub timeout: Option<Duration>,
    pub capture_stdout: bool,
}

impl StepCommand {
    pub fn describe(&self) -> String {
        format!("{} {}", self.program.display(), self.args.join(" "))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StepOutput {
    pub exit_code: Option<i32>,
    pub stdout: String,
}

impl StepOutput {
    pub fn succeeded(&self) -> bool {
        self.exit_code == Some(0)
    }
}

pub struct Commands {
    pub clear: StepCommand,
    pub adds: Vec<StepCommand>,
    pub resync: StepCommand,
    pub list_installed: StepCommand,
    pub apply: StepCommand,
    pub verify: StepCommand,
}

pub fn commands(config: &Config, zips: &[PathBuf]) -> Commands {
    let env = build_env(config);
    let step = |kind: StepKind, program: &Path, args: &[&str]| StepCommand {
        kind,
        program: program.to_path_buf(),
        args: args.iter().map(|arg| (*arg).to_string()).collect(),
        cwd: config.repo_dir.clone(),
        env: env.clone(),
        timeout: None,
        capture_stdout: false,
    };
    let list = |kind: StepKind, program: &Path| StepCommand {
        timeout: Some(LIST_TIMEOUT),
        capture_stdout: true,
        ..step(kind, program, &["extensions", "list", "--json"])
    };

    Commands {
        clear: step(
            StepKind::Clear,
            &config.stock_binary,
            &["extensions", "clear"],
        ),
        adds: zips
            .iter()
            .map(|zip| {
                step(
                    StepKind::Add,
                    &config.stock_binary,
                    &[
                        "extensions",
                        "add",
                        &zip.to_string_lossy(),
                        "--skip-version-check",
                        "--accept-license",
                    ],
                )
            })
            .collect(),
        resync: step(
            StepKind::Resync,
            &config.stock_binary,
            &["extensions", "resync"],
        ),
        list_installed: list(StepKind::ListInstalled, &config.stock_binary),
        apply: step(
            StepKind::Apply,
            &config.stock_binary,
            &[
                "extensions",
                "apply",
                "--skip-replace-binary",
                "--profile",
                config.profile.as_arg(),
                "--bin",
                &config.bin_name,
            ],
        ),
        verify: list(StepKind::VerifyList, &config.target_binary),
    }
}

fn build_env(config: &Config) -> Vec<(String, String)> {
    vec![
        ("SQLX_OFFLINE".to_string(), "true".to_string()),
        (
            "NODE_OPTIONS".to_string(),
            format!("--max-old-space-size={NODE_HEAP_MB}"),
        ),
        (
            "PANEL_EXTRA_TRANSLATIONS_DIR".to_string(),
            config.staged_translations_dir.display().to_string(),
        ),
    ]
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildStage {
    InstallingDependencies,
    BuildingFrontend,
    BuildingBackend,
}

pub fn classify_stage(line: &str) -> Option<BuildStage> {
    match line.trim() {
        "installing dependencies..." => Some(BuildStage::InstallingDependencies),
        "building frontend..." => Some(BuildStage::BuildingFrontend),
        "building backend..." => Some(BuildStage::BuildingBackend),
        _ => None,
    }
}

pub struct BuildRequest {
    pub build_id: u64,
    pub cache_key: String,
    pub panel_version: String,
    pub zips: Vec<PathBuf>,
}

impl BuildRequest {
    pub fn resolve(
        config: &Config,
        shipped_names: &BTreeSet<String>,
        panel_version: String,
        target: String,
        build_id: u64,
    ) -> anyhow::Result<Self> {
        let zips = crate::cache_key::collect::list_extension_zips(&config.extensions_dir)?;
        let inputs = crate::cache_key::collect::build_key_inputs(
            config,
            shipped_names,
            &zips,
            panel_version,
            target,
        )?;

        Ok(Self {
            build_id,
            cache_key: crate::cache_key::cache_key(&inputs),
            panel_version: inputs.panel_version,
            zips,
        })
    }
}

#[derive(Debug)]
pub enum BuildOutcome {
    Succeeded { entry: PathBuf, record: BuildRecord },
    Failed { record: BuildRecord },
}

struct Failure {
    reason: String,
    exit_code: Option<i32>,
}

impl From<anyhow::Error> for Failure {
    fn from(err: anyhow::Error) -> Self {
        Self {
            reason: format!("{err:#}"),
            exit_code: None,
        }
    }
}

pub fn open_log(binaries: &Path, build_id: u64) -> anyhow::Result<std::fs::File> {
    let dir = crate::store::build_record_dir(binaries, build_id);
    std::fs::create_dir_all(&dir).with_context(|| format!("creating {}", dir.display()))?;

    let path = dir.join(crate::store::record::BUILD_LOG_FILE);

    std::fs::File::create_new(&path).with_context(|| format!("creating {}", path.display()))
}

pub async fn run<R: CommandRunner>(
    config: &Config,
    request: &BuildRequest,
    shipped_names: &BTreeSet<String>,
    runner: &mut R,
    cancel: &Cancellation,
    report: &mut impl FnMut(BuildPhase),
) -> anyhow::Result<BuildOutcome> {
    let mut record = BuildRecord {
        schema: crate::store::record::BUILD_RECORD_SCHEMA,
        build_id: request.build_id,
        state: BuildState::Failed,
        panel_version: request.panel_version.clone(),
        cache_key: request.cache_key.clone(),
        bin_name: config.bin_name.clone(),
        intended_extensions: Vec::new(),
        verified_extensions: Vec::new(),
        verified: false,
        stock: false,
        started_at: crate::store::record::now(),
        finished_at: None,
        exit_code: None,
        failure_reason: None,
    };

    let built = pipeline(
        config,
        &request.zips,
        &mut record,
        shipped_names,
        runner,
        report,
    )
    .await;

    let binaries = &config.binaries_dir;
    let build_dir = crate::store::build_record_dir(binaries, request.build_id);
    record.finished_at = Some(crate::store::record::now());

    let outcome = match built {
        Ok(entry) => {
            record.state = BuildState::Succeeded;
            record.verified = true;
            record.exit_code = Some(0);
            crate::store::record::write_record(&build_dir, &record)?;
            crate::store::record::write_record(&entry, &record)?;
            crate::store::clear_failure_memo(binaries, &record.cache_key)?;

            BuildOutcome::Succeeded { entry, record }
        }
        Err(failure) => {
            let cancelled = cancel.is_cancelled();
            record.failure_reason = Some(if cancelled {
                format!("the build was cancelled: {}", failure.reason)
            } else {
                failure.reason
            });
            record.exit_code = failure.exit_code;
            crate::store::record::write_record(&build_dir, &record)?;
            if !cancelled {
                crate::store::write_failure_memo(binaries, &record)?;
            }

            BuildOutcome::Failed { record }
        }
    };

    if let BuildOutcome::Succeeded { .. } = outcome {
        crate::store::prune_entries(binaries, crate::store::KEEP_CACHE_ENTRIES)?;
    }
    crate::store::prune_state(
        binaries,
        crate::store::KEEP_BUILD_RECORDS,
        crate::store::KEEP_FAILURE_MEMOS,
    )?;

    Ok(outcome)
}

async fn pipeline<R: CommandRunner>(
    config: &Config,
    zips: &[PathBuf],
    record: &mut BuildRecord,
    shipped_names: &BTreeSet<String>,
    runner: &mut R,
    report: &mut impl FnMut(BuildPhase),
) -> Result<PathBuf, Failure> {
    report(BuildPhase::Preparing);

    if repo_is_dirty(&config.repo_dir) {
        runner
            .note("an earlier build left the repo partial, resetting it before building")
            .await?;
        reset_repo(&config.repo_dir)?;
    }
    mark_repo_dirty(&config.repo_dir)?;

    let commands = commands(config, zips);

    report(BuildPhase::Clearing);
    run_step(runner, &commands.clear).await?;

    let total = commands.adds.len() as u32;
    for (index, add) in commands.adds.iter().enumerate() {
        report(BuildPhase::Adding {
            done: index as u32,
            total,
        });
        run_step(runner, add).await?;
    }

    report(BuildPhase::Resync);
    run_step(runner, &commands.resync).await?;

    let listed = run_step(runner, &commands.list_installed).await?;
    record.intended_extensions = verify::parse_installed(&listed.stdout).with_context(|| {
        format!(
            "reading the intended extensions from {}",
            commands.list_installed.describe()
        )
    })?;

    if zips.is_empty() != record.intended_extensions.is_empty() {
        return Err(Failure {
            reason: format!(
                "{} extension archives are installed but the repo lists {}",
                zips.len(),
                record.intended_extensions.len()
            ),
            exit_code: None,
        });
    }

    report(BuildPhase::StagingTranslations);
    let skipped = crate::translations::stage(
        &config.translations_dir,
        &config.shipped_translations_dir,
        shipped_names,
        &config.staged_translations_dir,
    )?;
    for name in skipped {
        runner
            .note(&format!(
                "translation override {name} is not valid json and was not applied"
            ))
            .await?;
    }

    report(BuildPhase::Building);
    run_step(runner, &commands.apply).await?;

    clear_repo_dirty(&config.repo_dir)?;
    crate::translations::seed_shipped(&config.shipped_translations_dir, &config.translations_dir)?;

    report(BuildPhase::Verifying);
    let (verification, exit_code) = verify_built(runner, &commands.verify, record).await;
    if !verification.verified {
        return Err(Failure {
            reason: format!(
                "the built binary did not verify: {}",
                verification.failure_reason.unwrap_or_else(|| {
                    "it does not hold every extension this build was meant to compile in"
                        .to_string()
                })
            ),
            exit_code,
        });
    }
    record.verified_extensions = verification.compiled_in;

    report(BuildPhase::Installing);

    install(config, record)
}

async fn verify_built<R: CommandRunner>(
    runner: &mut R,
    command: &StepCommand,
    record: &BuildRecord,
) -> (verify::Verification, Option<i32>) {
    let listed = match runner.run(command).await {
        Ok(output) if output.succeeded() => output.stdout,
        Ok(output) => {
            return (
                not_verified(format!(
                    "{} exited with {}",
                    command.describe(),
                    describe_exit(output.exit_code)
                )),
                output.exit_code,
            );
        }
        Err(err) => return (not_verified(format!("{err:#}")), None),
    };

    (
        verify::verify_output(&listed, &record.intended_extensions),
        None,
    )
}

fn not_verified(reason: String) -> verify::Verification {
    verify::Verification {
        verified: false,
        compiled_in: Vec::new(),
        failure_reason: Some(reason),
    }
}

fn install(config: &Config, record: &BuildRecord) -> Result<PathBuf, Failure> {
    let entry = crate::store::entry_dir(
        &config.binaries_dir,
        &record.panel_version,
        &record.cache_key,
    );
    crate::store::install_binary(&entry, &record.bin_name, &config.target_binary)?;

    Ok(entry)
}

async fn run_step<R: CommandRunner>(
    runner: &mut R,
    command: &StepCommand,
) -> Result<StepOutput, Failure> {
    match runner.run(command).await {
        Ok(output) if output.succeeded() => Ok(output),
        Ok(output) => Err(Failure {
            reason: format!(
                "{} exited with {}",
                command.describe(),
                describe_exit(output.exit_code)
            ),
            exit_code: output.exit_code,
        }),
        Err(err) => Err(Failure {
            reason: format!("{err:#}"),
            exit_code: None,
        }),
    }
}

fn describe_exit(exit_code: Option<i32>) -> String {
    match exit_code {
        Some(code) => format!("code {code}"),
        None => "a signal".to_string(),
    }
}
