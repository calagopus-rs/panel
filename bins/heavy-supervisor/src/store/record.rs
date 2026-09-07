use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::path::Path;

pub const BUILD_RECORD_SCHEMA: u32 = 1;
pub const BUILD_RECORD_FILE: &str = "build.json";
pub const BUILD_LOG_FILE: &str = "build.log";

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum BuildState {
    Succeeded,
    Failed,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ExtensionRef {
    pub package_name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildRecord {
    pub schema: u32,
    pub build_id: u64,
    pub state: BuildState,
    pub panel_version: String,
    pub cache_key: String,
    pub bin_name: String,
    pub intended_extensions: Vec<ExtensionRef>,
    pub verified_extensions: Vec<ExtensionRef>,
    pub verified: bool,
    #[serde(default)]
    pub stock: bool,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub exit_code: Option<i32>,
    pub failure_reason: Option<String>,
}

pub fn extensions_satisfied(intended: &[ExtensionRef], compiled_in: &[ExtensionRef]) -> bool {
    intended.iter().all(|want| compiled_in.contains(want))
}

pub fn write_record(dir: &Path, record: &BuildRecord) -> anyhow::Result<()> {
    std::fs::create_dir_all(dir).with_context(|| format!("creating {}", dir.display()))?;
    std::fs::write(
        dir.join(BUILD_RECORD_FILE),
        serde_json::to_vec_pretty(record)?,
    )
    .with_context(|| format!("writing {BUILD_RECORD_FILE} in {}", dir.display()))
}

pub fn read_record(dir: &Path) -> Option<BuildRecord> {
    let raw = std::fs::read(dir.join(BUILD_RECORD_FILE)).ok()?;

    serde_json::from_slice(&raw).ok()
}

pub fn now() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
}
