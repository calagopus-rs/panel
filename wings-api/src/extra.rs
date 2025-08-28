use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, ToSchema, Deserialize, Serialize, Default, Clone, Copy)]
#[serde(rename_all = "snake_case")]
#[schema(rename_all = "snake_case")]
pub enum StreamableArchiveFormat {
    Tar,
    TarGz,
    TarXz,
    TarBz2,
    TarLz4,
    TarZstd,
    #[default]
    Zip,
}

impl std::fmt::Display for StreamableArchiveFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                StreamableArchiveFormat::Tar => "tar",
                StreamableArchiveFormat::TarGz => "tar_gz",
                StreamableArchiveFormat::TarXz => "tar_xz",
                StreamableArchiveFormat::TarBz2 => "tar_bz2",
                StreamableArchiveFormat::TarLz4 => "tar_lz4",
                StreamableArchiveFormat::TarZstd => "tar_zstd",
                StreamableArchiveFormat::Zip => "zip",
            }
        )
    }
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
#[schema(rename_all = "lowercase")]
pub enum Algorithm {
    Md5,
    Crc32,
    Sha1,
    Sha224,
    Sha256,
    Sha384,
    Sha512,
    Curseforge,
}

impl std::fmt::Display for Algorithm {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Algorithm::Md5 => "md5",
                Algorithm::Crc32 => "crc32",
                Algorithm::Sha1 => "sha1",
                Algorithm::Sha224 => "sha224",
                Algorithm::Sha256 => "sha256",
                Algorithm::Sha384 => "sha384",
                Algorithm::Sha512 => "sha512",
                Algorithm::Curseforge => "curseforge",
            }
        )
    }
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
#[schema(rename_all = "snake_case")]
pub enum Game {
    MinecraftJava,
}

impl std::fmt::Display for Game {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Game::MinecraftJava => "minecraft_java",
            }
        )
    }
}

#[derive(ToSchema, Deserialize, Serialize)]
pub struct ScheduleAction {
    pub uuid: uuid::Uuid,

    #[serde(flatten)]
    pub inner: ScheduleActionInner,
}

#[derive(ToSchema, Deserialize, Serialize)]
#[serde(rename_all = "snake_case", tag = "type")]
#[schema(rename_all = "snake_case")]
pub enum ScheduleActionInner {
    Sleep {
        duration: u64,
    },
    SendPower {
        ignore_failure: bool,

        action: super::ServerPowerAction,
    },
    SendCommand {
        ignore_failure: bool,

        command: String,
    },
    CreateBackup {
        ignore_failure: bool,
        foreground: bool,

        name: Option<String>,
        ignored_files: Vec<String>,
    },
    CreateDirectory {
        ignore_failure: bool,

        root: String,
        name: String,
    },
    WriteFile {
        ignore_failure: bool,
        append: bool,

        file: String,
        content: String,
    },
    CopyFile {
        ignore_failure: bool,
        foreground: bool,

        file: String,
        destination: String,
    },
    DeleteFiles {
        root: String,
        files: Vec<String>,
    },
    RenameFiles {
        root: String,
        #[schema(inline)]
        files: Vec<super::servers_server_files_rename::put::RequestBodyFiles>,
    },
    CompressFiles {
        ignore_failure: bool,
        foreground: bool,

        root: String,
        files: Vec<String>,
        format: super::ArchiveFormat,
        name: String,
    },
    DecompressFile {
        ignore_failure: bool,
        foreground: bool,

        root: String,
        file: String,
    },
    UpdateStartupVariable {
        ignore_failure: bool,

        env_variable: String,
        value: String,
    },
    UpdateStartupCommand {
        ignore_failure: bool,

        command: String,
    },
    UpdateStartupDockerImage {
        ignore_failure: bool,

        image: String,
    },
}

#[derive(ToSchema, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case", tag = "type")]
#[schema(rename_all = "snake_case")]
pub enum ScheduleTrigger {
    Cron {
        #[schema(value_type = String, example = "* * * * * *")]
        schedule: Box<cron::Schedule>,
    },
    PowerAction {
        action: super::ServerPowerAction,
    },
    ServerState {
        state: super::ServerState,
    },
    Crash,
}

#[derive(ToSchema, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
#[schema(rename_all = "snake_case")]
pub enum ScheduleComparator {
    SmallerThan,
    SmallerThanOrEquals,
    Equal,
    GreaterThan,
    GreaterThanOrEquals,
}

#[derive(ToSchema, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case", tag = "type")]
#[schema(rename_all = "snake_case", no_recursion)]
pub enum ScheduleCondition {
    None,
    And {
        conditions: Vec<ScheduleCondition>,
    },
    Or {
        conditions: Vec<ScheduleCondition>,
    },
    ServerState {
        state: super::ServerState,
    },
    Uptime {
        comparator: ScheduleComparator,
        value: u64,
    },
    CpuUsage {
        comparator: ScheduleComparator,
        value: f64,
    },
    MemoryUsage {
        comparator: ScheduleComparator,
        value: u64,
    },
    DiskUsage {
        comparator: ScheduleComparator,
        value: u64,
    },
    FileExists {
        file: String,
    },
}
