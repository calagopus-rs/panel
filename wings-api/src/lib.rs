// This file is auto-generated from OpenAPI spec. Do not edit manually.
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub mod client;

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ApiError {
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
    #[serde(rename = "tar_zstd")]
    TarZstd,
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
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct DirectoryEntry {
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
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Download {
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
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ExtensionInfo {
        #[schema(inline)]
        pub name: String,
        #[schema(inline)]
        pub description: String,
        #[schema(inline)]
        pub version: String,
        #[schema(inline)]
        pub author: String,
        #[schema(inline)]
        pub license: String,
        #[schema(inline)]
        pub additional: IndexMap<String, serde_json::Value>,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Mount {
        #[schema(inline)]
        pub target: String,
        #[schema(inline)]
        pub source: String,
        #[schema(inline)]
        pub read_only: bool,
    }
}

nestify::nest! {
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ResourceUsage {
        #[schema(inline)]
        pub memory_bytes: u64,
        #[schema(inline)]
        pub memory_limit_bytes: u64,
        #[schema(inline)]
        pub disk_bytes: u64,
        #[schema(inline)]
        pub state: ServerState,
        #[schema(inline)]
        pub network: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ResourceUsageNetwork {
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
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Server {
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
    #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfiguration {
        #[schema(inline)]
        pub uuid: uuid::Uuid,
        #[schema(inline)]
        pub start_on_completion: Option<bool>,
        #[schema(inline)]
        pub meta: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationMeta {
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
        pub allocations: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationAllocations {
            #[schema(inline)]
            pub force_outgoing_ip: bool,
            #[schema(inline)]
            pub default: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationServerConfigurationAllocationsDefault {
                #[schema(inline)]
                pub ip: String,
                #[schema(inline)]
                pub port: u32,
            }>,
            #[schema(inline)]
            pub mappings: IndexMap<String, Vec<u32>>,
        },

        #[schema(inline)]
        pub build: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationBuild {
            #[schema(inline)]
            pub memory_limit: i64,
            #[schema(inline)]
            pub swap: i64,
            #[schema(inline)]
            pub io_weight: u32,
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
        pub egg: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationEgg {
            #[schema(inline)]
            pub id: uuid::Uuid,
            #[schema(inline)]
            pub file_denylist: Vec<String>,
        },

        #[schema(inline)]
        pub container: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct ServerConfigurationContainer {
            #[schema(inline)]
            pub image: String,
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

pub mod extensions {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub extensions: Vec<ExtensionInfo>,
            }
        }
    }
}
pub mod servers {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Vec<Server>;
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub uuid: uuid::Uuid,
                #[schema(inline)]
                pub start_on_completion: bool,
                #[schema(inline)]
                pub skip_scripts: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response409 = ApiError;
    }
}
pub mod servers_server {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Server;
    }

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }
    }
}
pub mod servers_server_backup {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub adapter: BackupAdapter,
                #[schema(inline)]
                pub uuid: uuid::Uuid,
                #[schema(inline)]
                pub ignore: String,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response409 = ApiError;
    }
}
pub mod servers_server_backup_backup {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_backup_backup_restore {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub adapter: BackupAdapter,
                #[schema(inline)]
                pub truncate_directory: bool,
                #[schema(inline)]
                pub download_url: Option<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_commands {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub commands: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_chmod {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyFiles {
                    #[schema(inline)]
                    pub file: String,
                    #[schema(inline)]
                    pub mode: String,
                }>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub updated: u64,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_compress {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<String>,
            }
        }

        pub type Response200 = DirectoryEntry;

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
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
    }
}
pub mod servers_server_files_copy {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub location: String,
                #[schema(inline)]
                pub name: Option<String>,
            }
        }

        pub type Response200 = DirectoryEntry;

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_create_directory {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub name: String,
                #[schema(inline)]
                pub path: String,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_decompress {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub file: String,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_delete {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub deleted: u64,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_fingerprints {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub fingerprints: IndexMap<String, String>,
            }
        }
    }
}
pub mod servers_server_files_list {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub total: u64,
                #[schema(inline)]
                pub entries: Vec<DirectoryEntry>,
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_list_directory {
    use super::*;

    pub mod get {
        use super::*;

        pub type Response200 = Vec<DirectoryEntry>;

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_pull {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub downloads: Vec<Download>,
            }
        }
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
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
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub identifier: uuid::Uuid,
            }
        }

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_files_pull_pull {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_files_rename {
    use super::*;

    pub mod put {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub root: String,
                #[schema(inline)]
                pub files: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyFiles {
                    #[schema(inline)]
                    pub to: String,
                    #[schema(inline)]
                    pub from: String,
                }>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub renamed: u64,
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_files_search {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
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
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub results: Vec<DirectoryEntry>,
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_files_write {
    use super::*;

    pub mod post {
        use super::*;

        pub type RequestBody = String;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;

        pub type Response417 = ApiError;
    }
}
pub mod servers_server_logs {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub data: String,
            }
        }
    }
}
pub mod servers_server_power {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub action: ServerPowerAction,
                #[schema(inline)]
                pub wait_seconds: Option<u64>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response202 {
            }
        }
    }
}
pub mod servers_server_reinstall {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response409 = ApiError;
    }
}
pub mod servers_server_sync {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }
    }
}
pub mod servers_server_transfer {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response417 = ApiError;
    }

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub url: String,
                #[schema(inline)]
                pub token: String,
                #[schema(inline)]
                pub archive_format: ArchiveFormat,
                #[schema(inline)]
                pub compression_level: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyCompressionLevel {
                }>,
                #[schema(inline)]
                pub backups: Vec<uuid::Uuid>,
                #[schema(inline)]
                pub delete_backups: bool,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response202 {
            }
        }

        pub type Response409 = ApiError;
    }
}
pub mod servers_server_version {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub hash: String,
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod servers_server_ws_deny {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub jtis: Vec<String>,
            }
        }

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }
    }
}
pub mod servers_server_ws_permissions {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub user_permissions: Vec<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyUserPermissions {
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
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }
    }
}
pub mod stats {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub cpu: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200Cpu {
                    #[schema(inline)]
                    pub used: f64,
                    #[schema(inline)]
                    pub threads: u64,
                    #[schema(inline)]
                    pub model: String,
                },

                #[schema(inline)]
                pub network: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200Network {
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
                pub memory: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200Memory {
                    #[schema(inline)]
                    pub used: u64,
                    #[schema(inline)]
                    pub total: u64,
                },

                #[schema(inline)]
                pub disk: #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200Disk {
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
    }
}
pub mod system {
    use super::*;

    pub mod get {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
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
    }
}
pub mod transfers {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response401 = ApiError;

        pub type Response409 = ApiError;
    }
}
pub mod transfers_server {
    use super::*;

    pub mod delete {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
            }
        }

        pub type Response404 = ApiError;
    }
}
pub mod update {
    use super::*;

    pub mod post {
        use super::*;

        nestify::nest! {
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBody {
                #[schema(inline)]
                pub debug: Option<bool>,
                #[schema(inline)]
                pub app_name: Option<String>,
                #[schema(inline)]
                pub api: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyApi {
                    #[schema(inline)]
                    pub host: Option<String>,
                    #[schema(inline)]
                    pub port: Option<u32>,
                    #[schema(inline)]
                    pub ssl: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyRequestBodyApiSsl {
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
                pub system: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodySystem {
                    #[schema(inline)]
                    pub sftp: Option<#[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct RequestBodyRequestBodySystemSftp {
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
            #[derive(Debug, ToSchema, Deserialize, Serialize)] pub struct Response200 {
                #[schema(inline)]
                pub applied: bool,
            }
        }
    }
}
