// This file is auto-generated from OpenAPI spec. Do not edit manually.
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod client;
mod extra;
pub use extra::*;

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ApiError {
        #[schema(inline)]
        pub error: String,
    }
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum ArchiveFormat {
    #[serde(rename = "tar")]
    Tar,
    #[serde(rename = "tar_gz")]
    TarGz,
    #[serde(rename = "tar_xz")]
    TarXz,
    #[serde(rename = "tar_bz2")]
    TarBz2,
    #[serde(rename = "tar_lz4")]
    TarLz4,
    #[serde(rename = "tar_zstd")]
    TarZstd,
    #[serde(rename = "zip")]
    Zip,
    #[serde(rename = "seven_zip")]
    SevenZip,
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum BackupAdapter {
    #[serde(rename = "wings")]
    Wings,
    #[serde(rename = "s3")]
    S3,
    #[serde(rename = "ddup-bak")]
    DdupBak,
    #[serde(rename = "btrfs")]
    Btrfs,
    #[serde(rename = "zfs")]
    Zfs,
    #[serde(rename = "restic")]
    Restic,
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum CompressionLevel {
    #[serde(rename = "best_speed")]
    BestSpeed,
    #[serde(rename = "good_speed")]
    GoodSpeed,
    #[serde(rename = "good_compression")]
    GoodCompression,
    #[serde(rename = "best_compression")]
    BestCompression,
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct DirectoryEntry {
        #[schema(inline)]
        pub name: String,
        #[schema(inline)]
        pub created: chrono::DateTime<chrono::Utc>,
        #[schema(inline)]
        pub modified: chrono::DateTime<chrono::Utc>,
        #[schema(inline)]
        pub mode: String,
        #[schema(inline)]
        pub mode_bits: String,
        #[schema(inline)]
        pub size: u64,
        #[schema(inline)]
        pub directory: bool,
        #[schema(inline)]
        pub file: bool,
        #[schema(inline)]
        pub symlink: bool,
        #[schema(inline)]
        pub mime: String,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Download {
        #[schema(inline)]
        pub identifier: uuid::Uuid,
        #[schema(inline)]
        pub destination: String,
        #[schema(inline)]
        pub progress: u64,
        #[schema(inline)]
        pub total: u64,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct InstallationScript {
        #[schema(inline)]
        pub container_image: String,
        #[schema(inline)]
        pub entrypoint: String,
        #[schema(inline)]
        pub script: String,
        #[schema(inline)]
        pub environment: IndexMap<String, serde_json::Value>,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Mount {
        #[schema(inline)]
        pub target: String,
        #[schema(inline)]
        pub source: String,
        #[schema(inline)]
        pub read_only: bool,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ResourceUsage {
        #[schema(inline)]
        pub memory_bytes: u64,
        #[schema(inline)]
        pub memory_limit_bytes: u64,
        #[schema(inline)]
        pub disk_bytes: u64,
        #[schema(inline)]
        pub state: ServerState,
        #[schema(inline)]
        pub network: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ResourceUsageNetwork {
            #[schema(inline)]
            pub rx_bytes: u64,
            #[schema(inline)]
            pub tx_bytes: u64,
        },

        #[schema(inline)]
        pub cpu_absolute: f64,
        #[schema(inline)]
        pub uptime: u64,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Schedule {
        #[schema(inline)]
        pub uuid: uuid::Uuid,
        #[schema(inline)]
        pub triggers: serde_json::Value,
        #[schema(inline)]
        pub condition: serde_json::Value,
        #[schema(inline)]
        pub actions: Vec<serde_json::Value>,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ScheduleStatus {
        #[schema(inline)]
        pub running: bool,
        #[schema(inline)]
        pub step: Option<uuid::Uuid>,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Server {
        #[schema(inline)]
        pub state: ServerState,
        #[schema(inline)]
        pub is_suspended: bool,
        #[schema(inline)]
        pub utilization: ResourceUsage,
        #[schema(inline)]
        pub configuration: ServerConfiguration,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfiguration {
        #[schema(inline)]
        pub uuid: uuid::Uuid,
        #[schema(inline)]
        pub start_on_completion: Option<bool>,
        #[schema(inline)]
        pub meta: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationMeta {
            #[schema(inline)]
            pub name: String,
            #[schema(inline)]
            pub description: String,
        },

        #[schema(inline)]
        pub suspended: bool,
        #[schema(inline)]
        pub invocation: String,
        #[schema(inline)]
        pub skip_egg_scripts: bool,
        #[schema(inline)]
        pub environment: IndexMap<String, serde_json::Value>,
        #[schema(inline)]
        pub labels: IndexMap<String, String>,
        #[schema(inline)]
        pub backups: Vec<uuid::Uuid>,
        #[schema(inline)]
        pub schedules: Vec<Schedule>,
        #[schema(inline)]
        pub allocations: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationAllocations {
            #[schema(inline)]
            pub force_outgoing_ip: bool,
            #[schema(inline)]
            pub default: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationAllocationsDefault {
                #[schema(inline)]
                pub ip: String,
                #[schema(inline)]
                pub port: u32,
            }>,
            #[schema(inline)]
            pub mappings: IndexMap<String, Vec<u32>>,
        },

        #[schema(inline)]
        pub build: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationBuild {
            #[schema(inline)]
            pub memory_limit: i64,
            #[schema(inline)]
            pub swap: i64,
            #[schema(inline)]
            pub io_weight: Option<u32>,
            #[schema(inline)]
            pub cpu_limit: i64,
            #[schema(inline)]
            pub disk_space: u64,
            #[schema(inline)]
            pub threads: Option<String>,
            #[schema(inline)]
            pub oom_disabled: bool,
        },

        #[schema(inline)]
        pub mounts: Vec<Mount>,
        #[schema(inline)]
        pub egg: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationEgg {
            #[schema(inline)]
            pub id: uuid::Uuid,
            #[schema(inline)]
            pub file_denylist: Vec<String>,
        },

        #[schema(inline)]
        pub container: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationContainer {
            #[schema(inline)]
            pub privileged: bool,
            #[schema(inline)]
            pub image: String,
            #[schema(inline)]
            pub timezone: Option<String>,
            #[schema(inline)]
            pub seccomp: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationContainerSeccomp {
                #[schema(inline)]
                pub remove_allowed: Vec<String>,
            },

        },

        #[schema(inline)]
        pub auto_kill: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct ServerConfigurationAutoKill {
            #[schema(inline)]
            pub enabled: bool,
            #[schema(inline)]
            pub seconds: u64,
        },

    }
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum ServerPowerAction {
    #[serde(rename = "start")]
    Start,
    #[serde(rename = "stop")]
    Stop,
    #[serde(rename = "restart")]
    Restart,
    #[serde(rename = "kill")]
    Kill,
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum ServerState {
    #[serde(rename = "offline")]
    Offline,
    #[serde(rename = "starting")]
    Starting,
    #[serde(rename = "stopping")]
    Stopping,
    #[serde(rename = "running")]
    Running,
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum SystemBackupsDdupBakCompressionFormat {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "deflate")]
    Deflate,
    #[serde(rename = "gzip")]
    Gzip,
    #[serde(rename = "brotli")]
    Brotli,
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum SystemDiskLimiterMode {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "btrfs_subvolume")]
    BtrfsSubvolume,
    #[serde(rename = "zfs_dataset")]
    ZfsDataset,
    #[serde(rename = "xfs_quota")]
    XfsQuota,
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct SystemStats {
        #[schema(inline)]
        pub cpu: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct SystemStatsCpu {
            #[schema(inline)]
            pub used: f64,
            #[schema(inline)]
            pub threads: u64,
            #[schema(inline)]
            pub model: String,
        },

        #[schema(inline)]
        pub network: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct SystemStatsNetwork {
            #[schema(inline)]
            pub received: u64,
            #[schema(inline)]
            pub receiving_rate: f64,
            #[schema(inline)]
            pub sent: u64,
            #[schema(inline)]
            pub sending_rate: f64,
        },

        #[schema(inline)]
        pub memory: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct SystemStatsMemory {
            #[schema(inline)]
            pub used: u64,
            #[schema(inline)]
            pub total: u64,
        },

        #[schema(inline)]
        pub disk: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct SystemStatsDisk {
            #[schema(inline)]
            pub used: u64,
            #[schema(inline)]
            pub total: u64,
            #[schema(inline)]
            pub read: u64,
            #[schema(inline)]
            pub reading_rate: f64,
            #[schema(inline)]
            pub written: u64,
            #[schema(inline)]
            pub writing_rate: f64,
        },

    }
}

#[derive(Debug, ToSchema, Deserialize, Serialize, Clone, Copy)]
pub enum TransferArchiveFormat {
    #[serde(rename = "tar")]
    Tar,
    #[serde(rename = "tar_gz")]
    TarGz,
    #[serde(rename = "tar_xz")]
    TarXz,
    #[serde(rename = "tar_bz2")]
    TarBz2,
    #[serde(rename = "tar_lz4")]
    TarLz4,
    #[serde(rename = "tar_zstd")]
    TarZstd,
}

pub mod backups_backup {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub adapter: BackupAdapter,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Vec<Server>;

        pub type Response = Response200;
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub uuid: uuid::Uuid,
                #[schema(inline)]
                pub start_on_completion: bool,
                #[schema(inline)]
                pub skip_scripts: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response409 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Server;

        pub type Response = Response200;
    }

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_backup {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub adapter: BackupAdapter,
                #[schema(inline)]
                pub uuid: uuid::Uuid,
                #[schema(inline)]
                pub ignore: String,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response409 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_backup_backup {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_backup_backup_restore {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub adapter: BackupAdapter,
                #[schema(inline)]
                pub truncate_directory: bool,
                #[schema(inline)]
                pub download_url: Option<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_commands {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub commands: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_chmod {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodyFiles {
                    #[schema(inline)]
                    pub file: String,
                    #[schema(inline)]
                    pub mode: String,
                }>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub updated: u64,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_compress {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub format: ArchiveFormat,
                #[schema(inline)]
                pub name: Option<String>,
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<String>,
                #[schema(inline)]
                pub foreground: bool,
            }
        }

        pub type Response200 = DirectoryEntry;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
                #[schema(inline)]
                pub identifier: uuid::Uuid,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        #[derive(Deserialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok(Response200),
            Accepted(Response202),
        }
    }
}
pub mod servers_server_files_contents {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = String;

        pub type Response404 = ApiError;

        pub type Response413 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_copy {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub location: String,
                #[schema(inline)]
                pub name: Option<String>,
            }
        }

        pub type Response200 = DirectoryEntry;

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_create_directory {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub name: String,
                #[schema(inline)]
                pub path: String,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_decompress {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub file: String,
                #[schema(inline)]
                pub foreground: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
                #[schema(inline)]
                pub identifier: uuid::Uuid,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        #[derive(Deserialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok(Response200),
            Accepted(Response202),
        }
    }
}
pub mod servers_server_files_delete {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub deleted: u64,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_fingerprints {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub fingerprints: IndexMap<String, String>,
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_files_list {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub total: u64,
                #[schema(inline)]
                pub entries: Vec<DirectoryEntry>,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_list_directory {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Vec<DirectoryEntry>;

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_operations_operation {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_pull {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub downloads: Vec<Download>,
            }
        }

        pub type Response = Response200;
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub url: String,
                #[schema(inline)]
                pub file_name: Option<String>,
                #[schema(inline)]
                pub use_header: bool,
                #[schema(inline)]
                pub foreground: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
                #[schema(inline)]
                pub identifier: uuid::Uuid,
            }
        }

        pub type Response417 = ApiError;

        #[derive(Deserialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok(Response200),
            Accepted(Response202),
        }
    }
}
pub mod servers_server_files_pull_pull {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_rename {
    use super::*;

    pub mod put {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodyFiles {
                    #[schema(inline)]
                    pub from: String,
                    #[schema(inline)]
                    pub to: String,
                }>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub renamed: u64,
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_search {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub query: String,
                #[schema(inline)]
                pub include_content: bool,
                #[schema(inline)]
                pub limit: Option<u64>,
                #[schema(inline)]
                pub max_size: Option<u64>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub results: Vec<DirectoryEntry>,
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_files_write {
    use super::*;

    pub mod post {
        use super::*;

        pub type RequestBody = String;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_install_abort {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response409 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_logs {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub data: String,
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_power {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub action: ServerPowerAction,
                #[schema(inline)]
                pub wait_seconds: Option<u64>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response = Response202;
    }
}
pub mod servers_server_reinstall {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub truncate_directory: bool,
                #[schema(inline)]
                pub installation_script: Option<InstallationScript>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response409 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_schedules_schedule {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub status: ScheduleStatus,
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_schedules_schedule_abort {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_schedules_schedule_trigger {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub skip_condition: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_script {
    use super::*;

    pub mod post {
        use super::*;

        pub type RequestBody = InstallationScript;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub stdout: String,
                #[schema(inline)]
                pub stderr: String,
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_sync {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub server: serde_json::Value,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_transfer {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response417 = ApiError;

        pub type Response = Response200;
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub url: String,
                #[schema(inline)]
                pub token: String,
                #[schema(inline)]
                pub archive_format: TransferArchiveFormat,
                #[schema(inline)]
                pub compression_level: Option<CompressionLevel>,
                #[schema(inline)]
                pub backups: Vec<uuid::Uuid>,
                #[schema(inline)]
                pub delete_backups: bool,
                #[schema(inline)]
                pub multiplex_streams: u64,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        pub type Response409 = ApiError;

        pub type Response = Response202;
    }
}
pub mod servers_server_version {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub hash: String,
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod servers_server_ws_deny {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub jtis: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response = Response200;
    }
}
pub mod servers_server_ws_permissions {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub user_permissions: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodyUserPermissions {
                    #[schema(inline)]
                    pub user: uuid::Uuid,
                    #[schema(inline)]
                    pub permissions: Vec<String>,
                    #[schema(inline)]
                    pub ignored_files: Vec<String>,
                }>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response = Response200;
    }
}
pub mod system {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub architecture: String,
                #[schema(inline)]
                pub cpu_count: u64,
                #[schema(inline)]
                pub kernel_version: String,
                #[schema(inline)]
                pub os: String,
                #[schema(inline)]
                pub version: String,
            }
        }

        pub type Response = Response200;
    }
}
pub mod system_config {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub debug: bool,
                #[schema(inline)]
                pub app_name: String,
                #[schema(inline)]
                pub uuid: uuid::Uuid,
                #[schema(inline)]
                pub token_id: String,
                #[schema(inline)]
                pub token: String,
                #[schema(inline)]
                pub api: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200Api {
                    #[schema(inline)]
                    pub host: String,
                    #[schema(inline)]
                    pub port: u32,
                    #[schema(inline)]
                    pub ssl: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200ApiSsl {
                        #[schema(inline)]
                        pub enabled: bool,
                        #[schema(inline)]
                        pub cert: String,
                        #[schema(inline)]
                        pub key: String,
                    }>,
                    #[schema(inline)]
                    pub disable_openapi_docs: bool,
                    #[schema(inline)]
                    pub disable_remote_download: bool,
                    #[schema(inline)]
                    pub server_remote_download_limit: u64,
                    #[schema(inline)]
                    pub remote_download_blocked_cidrs: Vec<String>,
                    #[schema(inline)]
                    pub disable_directory_size: bool,
                    #[schema(inline)]
                    pub directory_entry_limit: u64,
                    #[schema(inline)]
                    pub send_offline_server_logs: bool,
                    #[schema(inline)]
                    pub file_search_threads: u64,
                    #[schema(inline)]
                    pub file_decompression_threads: u64,
                    #[schema(inline)]
                    pub file_compression_threads: u64,
                    #[schema(inline)]
                    pub upload_limit: u64,
                    #[schema(inline)]
                    pub max_jwt_uses: u64,
                    #[schema(inline)]
                    pub trusted_proxies: Vec<String>,
                },

                #[schema(inline)]
                pub system: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200System {
                    #[schema(inline)]
                    pub root_directory: String,
                    #[schema(inline)]
                    pub log_directory: String,
                    #[schema(inline)]
                    pub data: String,
                    #[schema(inline)]
                    pub archive_directory: String,
                    #[schema(inline)]
                    pub backup_directory: String,
                    #[schema(inline)]
                    pub tmp_directory: String,
                    #[schema(inline)]
                    pub username: String,
                    #[schema(inline)]
                    pub timezone: String,
                    #[schema(inline)]
                    pub user: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemUser {
                        #[schema(inline)]
                        pub rootless: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemUserRootless {
                            #[schema(inline)]
                            pub enabled: bool,
                            #[schema(inline)]
                            pub container_uid: u32,
                            #[schema(inline)]
                            pub container_gid: u32,
                        }>,
                        #[schema(inline)]
                        pub uid: u32,
                        #[schema(inline)]
                        pub gid: u32,
                    }>,
                    #[schema(inline)]
                    pub passwd: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemPasswd {
                        #[schema(inline)]
                        pub enabled: bool,
                        #[schema(inline)]
                        pub directory: String,
                    }>,
                    #[schema(inline)]
                    pub disk_check_interval: u64,
                    #[schema(inline)]
                    pub disk_check_threads: u64,
                    #[schema(inline)]
                    pub disk_limiter_mode: Option<SystemDiskLimiterMode>,
                    #[schema(inline)]
                    pub activity_send_interval: u64,
                    #[schema(inline)]
                    pub activity_send_count: u64,
                    #[schema(inline)]
                    pub check_permissions_on_boot: bool,
                    #[schema(inline)]
                    pub check_permissions_on_boot_threads: u64,
                    #[schema(inline)]
                    pub websocket_log_count: u64,
                    #[schema(inline)]
                    pub sftp: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemSftp {
                        #[schema(inline)]
                        pub bind_address: String,
                        #[schema(inline)]
                        pub bind_port: u32,
                        #[schema(inline)]
                        pub read_only: bool,
                        #[schema(inline)]
                        pub key_algorithm: String,
                        #[schema(inline)]
                        pub disable_password_auth: bool,
                        #[schema(inline)]
                        pub directory_entry_limit: u64,
                        #[schema(inline)]
                        pub directory_entry_send_amount: u64,
                        #[schema(inline)]
                        pub shell: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemSftpShell {
                            #[schema(inline)]
                            pub enabled: bool,
                            #[schema(inline)]
                            pub cli: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemSftpShellCli {
                                #[schema(inline)]
                                pub name: String,
                            }>,
                        }>,
                    }>,
                    #[schema(inline)]
                    pub crash_detection: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemCrashDetection {
                        #[schema(inline)]
                        pub enabled: bool,
                        #[schema(inline)]
                        pub detect_clean_exit_as_crash: bool,
                        #[schema(inline)]
                        pub timeout: u64,
                    }>,
                    #[schema(inline)]
                    pub backups: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackups {
                        #[schema(inline)]
                        pub write_limit: u64,
                        #[schema(inline)]
                        pub read_limit: u64,
                        #[schema(inline)]
                        pub compression_level: Option<CompressionLevel>,
                        #[schema(inline)]
                        pub mounting: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsMounting {
                            #[schema(inline)]
                            pub enabled: bool,
                            #[schema(inline)]
                            pub path: String,
                        }>,
                        #[schema(inline)]
                        pub wings: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsWings {
                            #[schema(inline)]
                            pub create_threads: u64,
                            #[schema(inline)]
                            pub restore_threads: u64,
                            #[schema(inline)]
                            pub archive_format: Option<ArchiveFormat>,
                        }>,
                        #[schema(inline)]
                        pub s3: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsS3 {
                            #[schema(inline)]
                            pub create_threads: u64,
                            #[schema(inline)]
                            pub part_upload_timeout: u64,
                            #[schema(inline)]
                            pub retry_limit: u64,
                        }>,
                        #[schema(inline)]
                        pub ddup_bak: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsDdupBak {
                            #[schema(inline)]
                            pub create_threads: u64,
                            #[schema(inline)]
                            pub compression_format: Option<SystemBackupsDdupBakCompressionFormat>,
                        }>,
                        #[schema(inline)]
                        pub restic: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsRestic {
                            #[schema(inline)]
                            pub repository: String,
                            #[schema(inline)]
                            pub password_file: String,
                            #[schema(inline)]
                            pub retry_lock_seconds: u64,
                            #[schema(inline)]
                            pub environment: IndexMap<String, String>,
                        }>,
                        #[schema(inline)]
                        pub btrfs: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsBtrfs {
                            #[schema(inline)]
                            pub restore_threads: u64,
                            #[schema(inline)]
                            pub create_read_only: bool,
                        }>,
                        #[schema(inline)]
                        pub zfs: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemBackupsZfs {
                            #[schema(inline)]
                            pub restore_threads: u64,
                        }>,
                    }>,
                    #[schema(inline)]
                    pub transfers: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200SystemTransfers {
                        #[schema(inline)]
                        pub download_limit: u64,
                    }>,
                },

                #[schema(inline)]
                pub docker: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200Docker {
                    #[schema(inline)]
                    pub socket: String,
                    #[schema(inline)]
                    pub server_name_in_container_name: bool,
                    #[schema(inline)]
                    pub delete_container_on_stop: bool,
                    #[schema(inline)]
                    pub network: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerNetwork {
                        #[schema(inline)]
                        pub interface: String,
                        #[schema(inline)]
                        pub disable_interface_binding: bool,
                        #[schema(inline)]
                        pub dns: Vec<String>,
                        #[schema(inline)]
                        pub name: String,
                        #[schema(inline)]
                        pub ispn: bool,
                        #[schema(inline)]
                        pub driver: String,
                        #[schema(inline)]
                        pub mode: String,
                        #[schema(inline)]
                        pub is_internal: bool,
                        #[schema(inline)]
                        pub enable_icc: bool,
                        #[schema(inline)]
                        pub network_mtu: u64,
                        #[schema(inline)]
                        pub interfaces: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerNetworkInterfaces {
                            #[schema(inline)]
                            pub v4: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerNetworkInterfacesV4 {
                                #[schema(inline)]
                                pub subnet: String,
                                #[schema(inline)]
                                pub gateway: String,
                            }>,
                            #[schema(inline)]
                            pub v6: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerNetworkInterfacesV6 {
                                #[schema(inline)]
                                pub subnet: String,
                                #[schema(inline)]
                                pub gateway: String,
                            }>,
                        }>,
                    }>,
                    #[schema(inline)]
                    pub domainname: String,
                    #[schema(inline)]
                    pub registries: IndexMap<String, serde_json::Value>,
                    #[schema(inline)]
                    pub tmpfs_size: u64,
                    #[schema(inline)]
                    pub container_pid_limit: u64,
                    #[schema(inline)]
                    pub installer_limits: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerInstallerLimits {
                        #[schema(inline)]
                        pub timeout: u64,
                        #[schema(inline)]
                        pub memory: u64,
                        #[schema(inline)]
                        pub cpu: u64,
                    }>,
                    #[schema(inline)]
                    pub overhead: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerOverhead {
                        #[schema(inline)]
                        pub r#override: bool,
                        #[schema(inline)]
                        pub default_multiplier: f64,
                        #[schema(inline)]
                        pub multipliers: IndexMap<String, f64>,
                    }>,
                    #[schema(inline)]
                    pub userns_mode: String,
                    #[schema(inline)]
                    pub log_config: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200DockerLogConfig {
                        #[schema(inline)]
                        pub r#type: String,
                        #[schema(inline)]
                        pub config: IndexMap<String, String>,
                    }>,
                },

                #[schema(inline)]
                pub throttles: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200Throttles {
                    #[schema(inline)]
                    pub enabled: bool,
                    #[schema(inline)]
                    pub lines: u64,
                    #[schema(inline)]
                    pub line_reset_interval: u64,
                },

                #[schema(inline)]
                pub remote: String,
                #[schema(inline)]
                pub remote_headers: IndexMap<String, String>,
                #[schema(inline)]
                pub remote_query: #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200RemoteQuery {
                    #[schema(inline)]
                    pub timeout: u64,
                    #[schema(inline)]
                    pub boot_servers_per_page: u64,
                    #[schema(inline)]
                    pub retry_limit: u64,
                },

                #[schema(inline)]
                pub allowed_mounts: Vec<String>,
                #[schema(inline)]
                pub allowed_origins: Vec<String>,
                #[schema(inline)]
                pub allow_cors_private_network: bool,
                #[schema(inline)]
                pub ignore_panel_config_updates: bool,
            }
        }

        pub type Response = Response200;
    }
}
pub mod system_logs {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub log_files: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200LogFiles {
                    #[schema(inline)]
                    pub name: String,
                    #[schema(inline)]
                    pub size: u64,
                    #[schema(inline)]
                    pub last_modified: chrono::DateTime<chrono::Utc>,
                }>,
            }
        }

        pub type Response = Response200;
    }
}
pub mod system_logs_file {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = String;

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod system_stats {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub stats: SystemStats,
            }
        }

        pub type Response = Response200;
    }
}
pub mod system_upgrade {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub url: String,
                #[schema(inline)]
                pub headers: IndexMap<String, String>,
                #[schema(inline)]
                pub sha256: String,
                #[schema(inline)]
                pub restart_command: String,
                #[schema(inline)]
                pub restart_command_args: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response202 {
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response409 {
                #[schema(inline)]
                pub error: String,
            }
        }

        pub type Response = Response202;
    }
}
pub mod transfers {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response401 = ApiError;

        pub type Response409 = ApiError;

        pub type Response = Response200;
    }
}
pub mod transfers_server {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response = Response200;
    }
}
pub mod update {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBody {
                #[schema(inline)]
                pub debug: Option<bool>,
                #[schema(inline)]
                pub app_name: Option<String>,
                #[schema(inline)]
                pub api: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodyApi {
                    #[schema(inline)]
                    pub host: Option<String>,
                    #[schema(inline)]
                    pub port: Option<u32>,
                    #[schema(inline)]
                    pub ssl: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodyApiSsl {
                        #[schema(inline)]
                        pub enabled: Option<bool>,
                        #[schema(inline)]
                        pub cert: Option<String>,
                        #[schema(inline)]
                        pub key: Option<String>,
                    }>,
                    #[schema(inline)]
                    pub upload_limit: Option<u64>,
                }>,
                #[schema(inline)]
                pub system: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodySystem {
                    #[schema(inline)]
                    pub sftp: Option<#[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct RequestBodySystemSftp {
                        #[schema(inline)]
                        pub bind_address: Option<String>,
                        #[schema(inline)]
                        pub bind_port: Option<u32>,
                    }>,
                }>,
                #[schema(inline)]
                pub allowed_origins: Option<Vec<String>>,
                #[schema(inline)]
                pub allow_cors_private_network: Option<bool>,
                #[schema(inline)]
                pub ignore_panel_config_updates: Option<bool>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize, Clone)] pub struct Response200 {
                #[schema(inline)]
                pub applied: bool,
            }
        }

        pub type Response = Response200;
    }
}
