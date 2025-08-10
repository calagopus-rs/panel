interface Location {
  id: number;
  shortName: string;
  name: string;
  description: string | null;
  backupDisk: LocationConfigBackupType;
  backupConfigs: LocationConfigBackup;
  nodes: number;
  created: Date;
}

interface Nest {
  id: number;
  author: string;
  name: string;
  description: string | null;
  eggs: number;
  created: Date;
}

interface AdminNestEgg {
  id: number;
  author: string;
  name: string;
  description: string;
  configFiles: {
    file: string;
    parser: ProcessConfigurationConfigParser;
    replace: {
      match: string;
      ifValue: string | null;
      replaceWith: string;
    }[];
  };
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
  dockerImages: {
    [key: string]: string;
  }[];
  fileDenylist: string[];
  created: Date;
}

interface NestEggVariable {
  id: number;
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

interface Node {
  id: number;
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
  servers: number;
  created: Date;
}

interface NodeAllocation {
  id: number;
  ip: string;
  ipAlias: string | null;
  port: number;
  created: Date;
}

interface AdminServer {
  id: number;
  uuid: string;
  uuidShort: string;
  externalId: string | null;
  allocation: ServerAllocation | null;
  node: Node;
  ower: User;
  egg: AdminNestEgg;
  status: ServerStatus | null;
  suspended: boolean;
  name: string;
  description: string | null;
  limits: {
    cpu: number;
    memory: number;
    swap: number;
    disk: number;
    ioWeight: number;
  };
  pinnedCpus: number[];
  feature_limits: {
    allocations: number;
    databases: number;
    backups: number;
  };
  startup: string;
  image: string;
  autoKill: {
    enabled: boolean;
    seconds: number;
  };
  timezone: string | null;
  created: Date;
}

interface NestEgg {
  id: number;
  name: string;
  description: string | null;
  startup: string;
  features: string[];
  dockerImages: {
    [key: string]: string;
  };
  created: Date;
}

interface ApiServer {
  id: number;
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
  limits: ApiServerLimits;
  feature_limits: ApiServerFeatureLimits;
  startup: string;
  image: string;
  autoKill: {
    enabled: boolean;
    seconds: number;
  };
  timezone: string | null;
  created: Date;
}

interface ServerActivity {
  id: number;
  user?: User;
  event: string;
  ip: string | null;
  data: object | null;
  isApi: boolean;
  created: Date;
}

interface ServerAllocation {
  id: number;
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
  completed: Date | null;
  created: Date;
}

interface ServerBackupWithProgress extends ServerBackup {
  progress?: {
    progress: number;
    total: number;
  };
}

interface ApiServerFeatureLimits {
  allocations: number;
  databases: number;
  backups: number;
}

interface ApiServerLimits {
  cpu: number;
  memory: number;
  swap: number;
  disk: number;
  ioWeight: number;
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

interface User {
  id: number;
  avatar?: string;
  username: string;
  email: string;
  nameFirst: string;
  nameLast: string;
  admin: boolean;
  totpEnabled: boolean;
  created: Date;
}

interface UserActivity {
  id: number;
  event: string;
  ip: string;
  data: object | null;
  isApi: boolean;
  created: Date;
}

interface UserApiKey {
  id: number;
  name: string;
  keyStart: string;
  permissions: string[];
  lastUsed: Date;
  created: Date;
}

interface UserSession {
  id: number;
  ip: string;
  userAgent: string;
  isUsing: boolean;
  lastUsed: Date;
  created: Date;
}

interface UserSshKey {
  id: number;
  name: string;
  fingerprint: string;
  created: Date;
}

type AuthenticationType = 'password' | 'public_key';

type CaptchaProviderType = 'none' | 'turnstile' | 'recaptcha';

interface CaptchaProviderBase {
  type: Exclude<CaptchaProviderType, 'turnstile' | 'recaptcha'>;
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

type CaptchaProvider = CaptchaProviderBase | CaptchaProviderTurnstile | CaptchaProviderRecaptcha;

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

type LocationConfigBackupType = 'local' | 's3' | 'ddup-bak' | 'btrfs' | 'zfs' | 'restic';

interface LocationConfigBackupBase {
  type: Exclude<LocationConfigBackupType, 's3'>;
}

interface LocationConfigBackupS3 {
  type: 's3';
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  pathStyle: boolean;
  partSize: number;
}

type LocationConfigBackup = LocationConfigBackupBase | LocationConfigBackupS3;

type MailModeType = 'none' | 'smtp';

interface MailModeBase {
  type: Exclude<MailModeType, 'smtp'>;
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

type MailMode = MailModeBase | MailModeSmtp;

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

type PublicCaptchaProviderType = 'none' | 'turnstile' | 'recaptcha';

interface PublicCaptchaProviderBase {
  type: Exclude<PublicCaptchaProviderType, 'turnstile' | 'recaptcha'>;
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
  | PublicCaptchaProviderBase
  | PublicCaptchaProviderTurnstile
  | PublicCaptchaProviderRecaptcha;

interface PublicSettings {
  captchaProvider: PublicCaptchaProvider;
  app: {
    name: string;
    icon: string;
  };
  server: {
    allowOverwritingCustomDockerImage: boolean;
    allowEditingStartupCommand: boolean;
    maxFileManagerViewSize: number;
  };
}

interface AdminSettings {
  mailMode: MailMode;
  captchaProvider: CaptchaProvider;
  app: {
    name: string;
    icon: string;
    url: string;
    telemetryEnabled: boolean;
  };
  server: {
    maxFileManagerViewSize: number;
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

interface PermissionData {
  [category: string]: [
    string,
    {
      [permission: string]: string;
    },
  ];
}

type ArchiveFormat = 'tar' | 'tar_gz' | 'tar_xz' | 'tar_bz2' | 'tar_lz4' | 'tar_zstd' | 'zip' | 'seven_zip';
