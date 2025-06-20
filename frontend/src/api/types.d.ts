export type ServerStatus =
  | 'installing'
  | 'install_failed'
  | 'reinstall_failed'
  | 'suspended'
  | 'restoring_backup'
  | null;

export interface ServerBackup {
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

export interface ServerEggVariable {
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  serverValue: string | null;
  isEditable: boolean;
  rules: string[];
}

export interface Allocation {
  id: number;
  ip: string;
  alias: string | null;
  port: number;
  notes: string | null;
  isDefault: boolean;
}

export interface Server {
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

export interface FileObject {
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
  isEditable: () => boolean;
}

export type ServerPowerState = 'offline' | 'starting' | 'running' | 'stopping';

export interface ServerStats {
  status: ServerPowerState;
  isSuspended: boolean;
  memoryUsageInBytes: number;
  cpuUsagePercent: number;
  diskUsageInBytes: number;
  networkRxInBytes: number;
  networkTxInBytes: number;
  uptime: number;
}
