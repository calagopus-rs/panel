interface AdminActivity {
  user?: User;
  event: string;
  ip: string | null;
  data: object | null;
  isApi: boolean;
  created: Date;
}

interface AdminUpdateDatabaseHost {
  name: string;
  username: string;
  password: string;
  host: string;
  port: number;
  public: boolean;
  publicHost: string | null;
  publicPort: number | null;
  type: DatabaseType;
}

interface AdminDatabaseHost extends AdminUpdateDatabaseHost {
  uuid: string;
  databases: number;
  locations: number;
  created: Date;
}

interface UpdateLocation {
  shortName: string;
  name: string;
  description: string | null;
  backupDisk: LocationConfigBackupDisk;
  backupConfigs: LocationConfigBackupConfigs;
}

interface Location extends UpdateLocation {
  uuid: string;
  nodes: number;
  created: Date;
}

interface AdminUpdateMount {
  name: string;
  description: string | null;
  source: string;
  target: string;
  readOnly: boolean;
  userMountable: boolean;
}

interface Mount extends AdminUpdateMount {
  uuid: string;
  eggs: number;
  nodes: number;
  servers: number;
  created: Date;
}

interface Nest {
  uuid: string;
  author: string;
  name: string;
  description: string | null;
  eggs: number;
  created: Date;
}

interface AdminUpdateNestEgg {
  author: string;
  name: string;
  description: string | null;
  configFiles: {
    file: string;
    parser: ProcessConfigurationConfigParser;
    replace: {
      match: string;
      ifValue: string | null;
      replaceWith: string;
    }[];
  }[];
  configStartup: {
    done: string[];
    stripAnsi: boolean;
  };
  configStop: {
    type: string;
    value: string | null;
  };
  configScript: {
    container: string;
    entrypoint: string;
    content: string;
  };
  configAllocations: {
    userSelfAssign: {
      enabled: boolean;
      requirePrimaryAllocation: boolean;
      startPort: number;
      endPort: number;
    };
  };
  startup: string;
  forceOutgoingIp: boolean;
  features: string[];
  dockerImages: Record<string, string>;
  fileDenylist: string[];
}

interface AdminNestEgg extends AdminUpdateNestEgg {
  uuid: string;
  servers: number;
  created: Date;
}

interface NestEggVariable {
  uuid: string;
  name: string;
  description: string | null;
  order: number;
  envVariable: string;
  defaultValue: string | null;
  userViewable: boolean;
  userEditable: boolean;
  rules: string[];
  created: Date;
}

interface UpdateNode {
  locationUuid: string;
  name: string;
  public: boolean;
  description: string | null;
  publicUrl: string | null;
  url: string;
  sftpHost: string | null;
  sftpPort: number;
  maintenanceMessage: string | null;
  memory: number;
  disk: number;
}

interface Node {
  uuid: string;
  location: Location;
  name: string;
  public: boolean;
  description: string | null;
  publicUrl: string | null;
  url: string;
  sftpHost: string | null;
  sftpPort: number;
  maintenanceMessage: string | null;
  memory: number;
  disk: number;
  tokenId: string;
  token: string;
  servers: number;
  created: Date;
}

interface NodeAllocation {
  uuid: string;
  ip: string;
  ipAlias: string | null;
  port: number;
  created: Date;
}

interface NodeMount {
  mount: Mount;
  created: Date;
}

interface UpdateAdminServer {
  externalId: string | null;
  name: string;
  description: string | null;
  startOnCompletion: boolean;
  skipScripts: boolean;
  limits: ServerLimits;
  pinnedCpus: number[];
  startup: string;
  image: string;
  timezone: string;
  featureLimits: ServerFeatureLimits;
  nodeUuid: string;
  ownerUuid: string;
  eggUuid: string;
  allocationUuid: string | null;
  allocationUuids: string[];
}

interface AdminServer {
  uuid: string;
  uuidShort: string;
  externalId: string | null;
  allocation: ServerAllocation | null;
  node: Node;
  owner: User;
  egg: AdminNestEgg;
  nest: Nest;
  status: ServerStatus | null;
  suspended: boolean;
  name: string;
  description: string | null;
  limits: ServerLimits;
  pinnedCpus: number[];
  featureLimits: ServerFeatureLimits;
  startup: string;
  image: string;
  autoKill: {
    enabled: boolean;
    seconds: number;
  };
  timezone: string | null;
  created: Date;
}

interface AdminServerMount {
  mount: Mount;
  created: Date;
}

interface DatabaseHost {
  uuid: string;
  name: string;
  host: string;
  port: number;
  type: DatabaseType;
}

interface LocationDatabaseHost {
  databaseHost: DatabaseHost;
  created: string;
}

interface NestEgg {
  uuid: string;
  name: string;
  description: string | null;
  startup: string;
  features: string[];
  dockerImages: {
    [key: string]: string;
  };
  created: Date;
}

interface Server {
  uuid: string;
  uuidShort: string;
  allocation: ServerAllocation | null;
  egg: NestEgg;
  status: ServerStatus | null;
  suspended: boolean;
  isOwner: boolean;
  permissions: string[];
  nodeUuid: string;
  nodeName: string;
  nodeMaintenanceMessage: string | null;
  sftpHost: string;
  sftpPort: number;
  name: string;
  description: string | null;
  limits: ServerLimits;
  featureLimits: ServerFeatureLimits;
  startup: string;
  image: string;
  autoKill: {
    enabled: boolean;
    seconds: number;
  };
  timezone: string | null;
  created: Date;
}

interface ImagePullProgress {
  status: 'pulling' | 'extracting';
  progress: number;
  total: number;
}

interface ServerActivity {
  user?: User;
  event: string;
  ip: string | null;
  data: object | null;
  isApi: boolean;
  created: Date;
}

interface ServerAllocation {
  uuid: string;
  ip: string;
  ipAlias: string | null;
  port: number;
  notes: string | null;
  isPrimary: boolean;
  created: Date;
}

interface ServerBackup {
  uuid: string;
  name: string;
  ignoredFiles: string[];
  isSuccessful: boolean;
  isLocked: boolean;
  isBrowsable: boolean;
  isStreaming: boolean;
  checksum: string | null;
  bytes: number;
  files: number;
  completed: Date | null;
  created: Date;
}

interface ServerBackupWithProgress extends ServerBackup {
  progress?: {
    progress: number;
    total: number;
  };
}

interface ServerDatabase {
  uuid: string;
  name: string;
  isLocked: boolean;
  username: string;
  password: string;
  host: string;
  port: number;
  type: DatabaseType;
  created: Date;
}

interface ServerFeatureLimits {
  allocations: number;
  databases: number;
  backups: number;
  schedules: number;
}

interface ServerLimits {
  cpu: number;
  memory: number;
  swap: number;
  disk: number;
  ioWeight: number;
}

interface ServerMount {
  uuid: string;
  name: string;
  description: string | null;
  readOnly: boolean;
  target: string;
  created: Date | null;
}

interface ServerSubuser {
  user: User;
  permissions: string[];
  ignoredFiles: string[];
  created: Date;
}

interface ServerVariable {
  name: string;
  description: string | null;
  envVariable: string;
  defaultValue: string | null;
  value: string;
  isEditable: boolean;
  rules: string[];
  created: Date;
}

interface ScheduleTriggerCron {
  type: 'cron';
  schedule: string;
}

interface ScheduleTriggerPowerAction {
  type: 'power_action';
  action: ServerPowerAction;
}

interface ScheduleTriggerServerState {
  type: 'server_state';
  state: ServerPowerState;
}

interface ScheduleTriggerCrash {
  type: 'crash';
}

type ScheduleTrigger =
  | ScheduleTriggerCron
  | ScheduleTriggerPowerAction
  | ScheduleTriggerServerState
  | ScheduleTriggerCrash;

type ScheduleTriggerType = ScheduleTrigger['type'];

type ScheduleComparator =
  | 'smaller_than'
  | 'smaller_than_or_equals'
  | 'equal'
  | 'greater_than'
  | 'greater_than_or_equals';

interface ScheduleConditionNone {
  type: 'none';
}

interface ScheduleConditionAnd {
  type: 'and';
  conditions: ScheduleCondition[];
}

interface ScheduleConditionOr {
  type: 'or';
  conditions: ScheduleCondition[];
}

interface ScheduleConditionServerState {
  type: 'server_state';
  state: ServerPowerState;
}

interface ScheduleConditionUptime {
  type: 'uptime';
  comparator: ScheduleComparator;
  value: number;
}

interface ScheduleConditionCpuUsage {
  type: 'cpu_usage';
  comparator: ScheduleComparator;
  value: number;
}

interface ScheduleConditionMemoryUsage {
  type: 'memory_usage';
  comparator: ScheduleComparator;
  value: number;
}

interface ScheduleConditionDiskUsage {
  type: 'disk_usage';
  comparator: ScheduleComparator;
  value: number;
}

interface ScheduleConditionFileExists {
  type: 'file_exists';
  file: string;
}

type ScheduleCondition =
  | ScheduleConditionNone
  | ScheduleConditionAnd
  | ScheduleConditionOr
  | ScheduleConditionServerState
  | ScheduleConditionUptime
  | ScheduleConditionCpuUsage
  | ScheduleConditionMemoryUsage
  | ScheduleConditionDiskUsage
  | ScheduleConditionFileExists;

interface ServerSchedule {
  uuid: string;
  name: string;
  enabled: boolean;
  triggers: ScheduleTrigger[];
  condition: ScheduleCondition;
  steps: number;
  lastRun: Date | null;
  lastFailure: Date | null;
  created: Date;
}

interface ScheduleStatus {
  running: boolean;
  step: string | null;
}

interface ScheduleActionSleep {
  type: 'sleep';
  duration: number;
}

interface ScheduleActionSendPower {
  type: 'send_power';
  ignoreFailure: boolean;
  action: ServerPowerAction;
}

interface ScheduleActionSendCommand {
  type: 'send_command';
  ignoreFailure: boolean;
  command: string;
}

interface ScheduleActionCreateBackup {
  type: 'create_backup';
  ignoreFailure: boolean;
  foreground: boolean;
  name: string | null;
  ignoredFiles: string[];
}

interface ScheduleActionCreateDirectory {
  type: 'create_directory';
  ignoreFailure: boolean;
  root: string;
  name: string;
}

interface ScheduleActionWriteFile {
  type: 'write_file';
  ignoreFailure: boolean;
  append: boolean;
  file: string;
  content: string;
}

interface ScheduleActionCopyFile {
  type: 'copy_file';
  ignoreFailure: boolean;
  foreground: boolean;
  file: string;
  destination: string;
}

interface ScheduleActionDeleteFiles {
  type: 'delete_files';
  root: string;
  files: string[];
}

interface ScheduleActionRenameFiles {
  type: 'rename_files';
  root: string;
  files: {
    from: string;
    to: string;
  }[];
}

interface ScheduleActionCompressFiles {
  type: 'compress_files';
  ignoreFailure: boolean;
  foreground: boolean;
  root: string;
  files: string[];
  format: ArchiveFormat;
  name: string;
}

interface ScheduleActionDecompressFile {
  type: 'decompress_file';
  ignoreFailure: boolean;
  foreground: boolean;
  root: string;
  file: string;
}

interface ScheduleActionUpdateStartupVariable {
  type: 'update_startup_variable';
  ignoreFailure: boolean;
  envVariable: string;
  value: string;
}

interface ScheduleActionUpdateStartupCommand {
  type: 'update_startup_command';
  ignoreFailure: boolean;
  command: string;
}

interface ScheduleActionUpdateStartupDockerImage {
  type: 'update_startup_docker_image';
  ignoreFailure: boolean;
  image: string;
}

type ScheduleAction =
  | ScheduleActionSleep
  | ScheduleActionSendPower
  | ScheduleActionSendCommand
  | ScheduleActionCreateBackup
  | ScheduleActionCreateDirectory
  | ScheduleActionWriteFile
  | ScheduleActionCopyFile
  | ScheduleActionDeleteFiles
  | ScheduleActionRenameFiles
  | ScheduleActionCompressFiles
  | ScheduleActionDecompressFile
  | ScheduleActionUpdateStartupVariable
  | ScheduleActionUpdateStartupCommand
  | ScheduleActionUpdateStartupDockerImage;

interface ScheduleStep {
  uuid: string;
  action: ScheduleAction;
  order: number;
  error: string | null;
  created: Date;
}

interface ScheduleStatus {
  running: boolean;
  step: string | null;
}

interface FileOperationCompress {
  type: 'compress';
  path: string;

  progress: number;
  total: number;
}

interface FileOperationDecompress {
  type: 'decompress';
  path: string;
  destination: string;

  progress: number;
  total: number;
}

interface FileOperationPull {
  type: 'pull';
  path: string;

  progress: number;
  total: number;
}

type FileOperation = FileOperationCompress | FileOperationDecompress | FileOperationPull;

interface User {
  uuid: string;
  avatar?: string;
  username: string;
  email: string;
  nameFirst: string;
  nameLast: string;
  password?: string;
  admin: boolean;
  totpEnabled: boolean;
  created: Date;
}

interface UserActivity {
  event: string;
  ip: string;
  data: object | null;
  isApi: boolean;
  created: Date;
}

interface UserApiKey {
  uuid: string;
  name: string;
  keyStart: string;
  permissions: string[];
  lastUsed: Date;
  created: Date;
}

interface UserSession {
  uuid: string;
  ip: string;
  userAgent: string;
  isUsing: boolean;
  lastUsed: Date;
  created: Date;
}

type SshKeyProvider = 'github' | 'gitlab' | 'launchpad';

interface UserSshKey {
  uuid: string;
  name: string;
  fingerprint: string;
  created: Date;
}

interface UserSecurityKey {
  uuid: string;
  name: string;
  lastUsed: Date | null;
  created: Date;
}

type AuthenticationType = 'password' | 'public_key';

interface CaptchaProviderNone {
  type: 'none';
}

interface CaptchaProviderTurnstile {
  type: 'turnstile';
  siteKey: string;
  secretKey: string;
}

interface CaptchaProviderRecaptcha {
  type: 'recaptcha';
  siteKey: string;
  secretKey: string;
  v3: boolean;
}

type CaptchaProvider = CaptchaProviderNone | CaptchaProviderTurnstile | CaptchaProviderRecaptcha;

type CompressionLevel = 'best_speed' | 'good_speed' | 'good_compression' | 'best_compression';

type DatabaseType = 'mysql' | 'postgres';

interface DirectoryEntry {
  name: string;
  created: Date;
  modified: Date;
  mode: string;
  modeBits: string;
  size: number;
  directory: boolean;
  file: boolean;
  symlink: boolean;
  mime: string;
}

interface Download {
  identifier: string;
  destination: string;
  progress: number;
  total: number;
}

type LocationConfigBackupDisk = 'local' | 's3' | 'ddup-bak' | 'btrfs' | 'zfs' | 'restic';

interface LocationConfigBackupConfigsS3 {
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  pathStyle: boolean;
  partSize: number;
}

interface LocationConfigBackupConfigsRestic {
  repository: string;
  retryLockSeconds: number;
  environment: Record<string, string>;
}

interface LocationConfigBackupConfigs {
  s3: LocationConfigBackupConfigsS3 | null;
  restic: LocationConfigBackupConfigsRestic | null;
}

type StorageDriverType = 'filesystem' | 's3';

interface StorageDriverFilesystem {
  type: 'filesystem';
  path: string;
}

interface StorageDriverS3 {
  type: 's3';
  publicUrl: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  pathStyle: boolean;
}

type StorageDriver = StorageDriverFilesystem | StorageDriverS3;

type MailModeType = 'none' | 'smtp';

interface MailModeNone {
  type: 'none';
}

interface MailModeSmtp {
  type: 'smtp';
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  useTls: boolean;
  fromAddress: string;
  fromName: string | null;
}

type MailMode = MailModeNone | MailModeSmtp;

type ProcessConfigurationConfigParser = 'file' | 'yaml' | 'properties' | 'ini' | 'json' | 'xml';

interface ProcessConfiguration {
  startup: {
    done: string[];
    stripAnsi: boolean;
  };
  stop: {
    type: string;
    value: string | null;
  };
  configs: {
    file: string;
    parser: ProcessConfigurationConfigParser;
    replace: {
      match: string;
      ifValue: string | null;
      replaceWith: string;
    }[];
  }[];
}

interface PublicCaptchaProviderNone {
  type: 'none';
}

interface PublicCaptchaProviderTurnstile {
  type: 'turnstile';
  siteKey: string;
}

interface PublicCaptchaProviderRecaptcha {
  type: 'recaptcha';
  siteKey: string;
  v3: boolean;
}

type PublicCaptchaProvider =
  | PublicCaptchaProviderNone
  | PublicCaptchaProviderTurnstile
  | PublicCaptchaProviderRecaptcha;

interface PublicSettings {
  version: string;
  captchaProvider: PublicCaptchaProvider;
  app: {
    name: string;
    registrationEnabled: boolean;
  };
  server: {
    maxFileManagerViewSize: number;
    maxSchedulesStepCount: number;
    allowOverwritingCustomDockerImage: boolean;
    allowEditingStartupCommand: boolean;
  };
}

interface AdminSettings {
  storageDriver: StorageDriver;
  mailMode: MailMode;
  captchaProvider: CaptchaProvider;
  app: {
    name: string;
    url: string;
    telemetryEnabled: boolean;
    registrationEnabled: boolean;
  };
  webauthn: {
    rpId: string;
    rpOrigin: string;
  };
  server: {
    maxFileManagerViewSize: number;
    maxSchedulesStepCount: number;
    allowOverwritingCustomDockerImage: boolean;
    allowEditingStartupCommand: boolean;
  };
}

interface ResourceUsage {
  memoryBytes: number;
  memoryLimitBytes: number;
  diskBytes: number;
  state: ServerPowerState;
  network: {
    rxBytes: number;
    txBytes: number;
  };
  cpuAbsolute: number;
  uptime: number;
}

interface ResponseMeta<T> {
  total: number;
  perPage: number;
  page: number;
  data: T[];
}

type ServerPowerState = 'offline' | 'starting' | 'stopping' | 'running';

type ServerPowerAction = 'start' | 'stop' | 'restart' | 'kill';

type ServerStatus = 'installing' | 'install_failed' | 'reinstall_failed' | 'restoring_backup';

interface PermissionMap {
  [category: string]: {
    description: string;
    permissions: Record<string, string>;
  };
}

type ArchiveFormat = 'tar' | 'tar_gz' | 'tar_xz' | 'tar_bz2' | 'tar_lz4' | 'tar_zstd' | 'zip' | 'seven_zip';
type StreamingArchiveFormat = 'tar' | 'tar_gz' | 'tar_xz' | 'tar_bz2' | 'tar_lz4' | 'tar_zstd' | 'zip';
