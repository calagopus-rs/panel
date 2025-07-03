interface User {
  id: number;
  avatar?: string;
  username: string;
  email: string;
  name_first: string;
  name_last: string;
  admin: boolean;
  totp_enabled: boolean;
  created: Date;
}

type ServerStatus = 'installing' | 'install_failed' | 'reinstall_failed' | 'suspended' | 'restoring_backup' | null;

interface ServerBackup {
  uuid: string;
  isSuccessful: boolean;
  isLocked: boolean;
  name: string;
  ignoredFiles: string;
  checksum: string;
  bytes: number;
  createdAt: Date;
  completedAt: Date | null;
}

interface ServerEggVariable {
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  serverValue: string | null;
  isEditable: boolean;
  rules: string[];
}

interface Allocation {
  id: number;
  ip: string;
  alias: string | null;
  port: number;
  notes: string | null;
  isDefault: boolean;
}

interface Server {
  id: string;
  internalId: number | string;
  uuid: string;
  name: string;
  node: string;
  isNodeUnderMaintenance: boolean;
  status: ServerStatus;
  sftpDetails: {
    ip: string;
    port: number;
  };
  invocation: string;
  dockerImage: string;
  description: string | null;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
    threads: string;
  };
  eggFeatures: string[];
  featureLimits: {
    databases: number;
    allocations: number;
    backups: number;
  };
  isTransferring: boolean;
  variables: ServerEggVariable[];
  allocations: Allocation[];
}

interface FileObject {
  key: string;
  name: string;
  mode: string;
  modeBits: string;
  size: number;
  isFile: boolean;
  isSymlink: boolean;
  mimetype: string;
  createdAt: Date;
  modifiedAt: Date;
  isArchiveType: () => boolean;
  isDirectory: () => boolean;
  isEditable: () => boolean;
}

type ServerPowerState = 'offline' | 'starting' | 'running' | 'stopping';

interface ServerStats {
  status: ServerPowerState;
  isSuspended: boolean;
  memoryUsageInBytes: number;
  cpuUsagePercent: number;
  diskUsageInBytes: number;
  networkRxInBytes: number;
  networkTxInBytes: number;
  uptime: number;
}

type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

interface ServerDatabase {
  id: string;
  name: string;
  username: string;
  connectionString: string;
  allowConnectionsFrom: string;
  password?: string;
}

interface CronObject {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

interface Schedule {
  id: number;
  name: string;
  cron: CronObject;
  isActive: boolean;
  isProcessing: boolean;
  onlyWhenOnline: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  tasks: Task[];
}

interface Task {
  id: number;
  sequenceId: number;
  action: string;
  payload: string;
  timeOffset: number;
  isQueued: boolean;
  continueOnFailure: boolean;
  createdAt: Date;
  updatedAt: Date;
}
