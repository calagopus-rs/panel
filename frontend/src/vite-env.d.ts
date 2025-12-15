/// <reference types="vite/client" />

import type { ExtensionContext } from 'shared';

declare global {
  interface Window {
    extensionContext: ExtensionContext;
  }

  type AndCreated<T extends object> = T & {
    created: Date;
  };

  interface AdminActivity {
    user?: User;
    event: string;
    ip: string | null;
    data: object | null;
    isApi: boolean;
    created: Date;
  }

  interface BackupConfiguration {
    name: string;
    description?: string;
    backupDisk: BackupDisk;
    backupConfigs: BackupDiskConfigurations;
    uuid: string;
    created: Date;
  }

  interface AdminDatabaseHost {
    uuid: string;
    name: string;
    username: string;
    password: string;
    host: string;
    port: number;
    public: boolean;
    publicHost: string | null;
    publicPort: number | null;
    type: DatabaseType;
    created: Date;
  }

  interface AdminOAuthProvider {
    uuid: string;
    name: string;
    description: string | null;
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    infoUrl: string;
    scopes: string[];
    identifierPath: string;
    emailPath: string | null;
    usernamePath: string | null;
    nameFirstPath: string | null;
    nameLastPath: string | null;
    enabled: boolean;
    loginOnly: boolean;
    linkViewable: boolean;
    userManageable: boolean;
    basicAuth: boolean;
    created: Date;
  }

  interface AdminUserOAuthLink {
    uuid: string;
    user: User;
    identifier: string;
    lastUsed: Date | null;
    created: Date;
  }

  interface Location {
    uuid: string;
    name: string;
    description: string | null;
    backupConfiguration: BackupConfiguration | null;
    created: Date;
  }

  interface Mount {
    uuid: string;
    name: string;
    description: string | null;
    source: string;
    target: string;
    readOnly: boolean;
    userMountable: boolean;
    created: Date;
  }

  interface AdminUpdateEggRepository {
    name: string;
    description: string | null;
    gitRepository: string;
  }

  interface AdminEggRepository extends AdminUpdateEggRepository {
    uuid: string;
    created: Date;
  }

  interface AdminEggRepositoryEgg {
    uuid: string;
    path: string;
    author: string;
    name: string;
    description: string | null;
    exportedEgg: object;
  }

  interface AdminNest {
    uuid: string;
    author: string;
    name: string;
    description: string | null;
    created: Date;
  }

  interface AdminUpdateNestEgg {
    author: string;
    name: string;
    description: string | null;
    eggRepositoryEggUuid: string | null;
    configFiles: {
      file: string;
      createNew: boolean;
      parser: ProcessConfigurationConfigParser;
      replace: {
        match: string;
        insertNew: boolean;
        updateExisting: boolean;
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
    separatePort: boolean;
    features: string[];
    dockerImages: Record<string, string>;
    fileDenylist: string[];
  }

  interface AdminNestEgg extends Omit<AdminUpdateNestEgg, 'eggRepositoryEggUuid'> {
    uuid: string;
    eggRepositoryEgg: (AdminEggRepositoryEgg & { eggRepository: AdminEggRepository }) | null;
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

  interface Node {
    uuid: string;
    location: Location;
    backupConfiguration: BackupConfiguration | null;
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
    created: Date;
  }

  interface NodeAllocation {
    uuid: string;
    server: AdminServer | null;
    ip: string;
    ipAlias: string | null;
    port: number;
    created: Date;
  }

  interface NodeMount {
    mount: Mount;
    created: Date;
  }

  interface Role {
    uuid: string;
    name: string;
    description: string | null;
    serverPermissions: string[];
    adminPermissions: string[];
    created: Date;
  }

  interface AdminServer {
    uuid: string;
    uuidShort: string;
    externalId: string | null;
    allocation: ServerAllocation | null;
    node: Node;
    owner: User;
    egg: AdminNestEgg;
    backupConfiguration: BackupConfiguration | null;
    nest: AdminNest;
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
    timezone: string;
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
    separatePort: boolean;
    features: string[];
    dockerImages: {
      [key: string]: string;
    };
    created: Date;
  }

  interface OAuthProvider {
    uuid: string;
    name: string;
    linkViewable: boolean;
    userManageable: boolean;
  }

  interface UserOAuthLink {
    uuid: string;
    oauthProvider: OAuthProvider;
    identifier: string;
    lastUsed: Date | null;
    created: Date;
  }

  interface UserServerGroup {
    uuid: string;
    name: string;
    order: number;
    serverOrder: string[];
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

  interface AdminServerDatabase {
    uuid: string;
    server: AdminServer;
    name: string;
    isLocked: boolean;
    username: string;
    password: string;
    host: string;
    port: number;
    type: DatabaseType;
    created: Date;
  }

  interface ServerDatabase {
    uuid: string;
    name: string;
    isLocked: boolean;
    username: string;
    password: string | null;
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

  interface ScheduleTriggerBackupStatus {
    type: 'backup_status';
    status: ServerBackupStatus;
  }

  interface ScheduleTriggerConsoleLine {
    type: 'console_line';
    contains: string;
    outputInto: ScheduleVariable | null;
  }

  interface ScheduleTriggerCrash {
    type: 'crash';
  }

  type ScheduleTrigger =
    | ScheduleTriggerCron
    | ScheduleTriggerPowerAction
    | ScheduleTriggerServerState
    | ScheduleTriggerBackupStatus
    | ScheduleTriggerConsoleLine
    | ScheduleTriggerCrash;

  type ScheduleTriggerType = ScheduleTrigger['type'];

  type ScheduleComparator =
    | 'smaller_than'
    | 'smaller_than_or_equals'
    | 'equal'
    | 'greater_than'
    | 'greater_than_or_equals';

  interface SchedulePreConditionNone {
    type: 'none';
  }

  interface SchedulePreConditionAnd {
    type: 'and';
    conditions: SchedulePreCondition[];
  }

  interface SchedulePreConditionOr {
    type: 'or';
    conditions: SchedulePreCondition[];
  }

  interface SchedulePreConditionNot {
    type: 'not';
    condition: SchedulePreCondition;
  }

  interface SchedulePreConditionServerState {
    type: 'server_state';
    state: ServerPowerState;
  }

  interface SchedulePreConditionUptime {
    type: 'uptime';
    comparator: ScheduleComparator;
    value: number;
  }

  interface SchedulePreConditionCpuUsage {
    type: 'cpu_usage';
    comparator: ScheduleComparator;
    value: number;
  }

  interface SchedulePreConditionMemoryUsage {
    type: 'memory_usage';
    comparator: ScheduleComparator;
    value: number;
  }

  interface SchedulePreConditionDiskUsage {
    type: 'disk_usage';
    comparator: ScheduleComparator;
    value: number;
  }

  interface SchedulePreConditionFileExists {
    type: 'file_exists';
    file: string;
  }

  type SchedulePreCondition =
    | SchedulePreConditionNone
    | SchedulePreConditionAnd
    | SchedulePreConditionOr
    | SchedulePreConditionNot
    | SchedulePreConditionServerState
    | SchedulePreConditionUptime
    | SchedulePreConditionCpuUsage
    | SchedulePreConditionMemoryUsage
    | SchedulePreConditionDiskUsage
    | SchedulePreConditionFileExists;

  interface ServerSchedule {
    uuid: string;
    name: string;
    enabled: boolean;
    triggers: ScheduleTrigger[];
    condition: SchedulePreCondition;
    lastRun: Date | null;
    lastFailure: Date | null;
    created: Date;
  }

  interface ScheduleStatus {
    running: boolean;
    step: string | null;
  }

  interface ScheduleVariable {
    variable: string;
  }

  type ScheduleDynamicParameter = string | ScheduleVariable;

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

  interface ScheduleConditionNot {
    type: 'not';
    condition: ScheduleCondition;
  }

  interface ScheduleConditionVariableExists {
    type: 'variable_exists';
    variable: ScheduleVariable;
  }

  interface ScheduleConditionVariableEquals {
    type: 'variable_equals';
    variable: ScheduleVariable;
    equals: ScheduleDynamicParameter;
  }

  interface ScheduleConditionVariableContains {
    type: 'variable_contains';
    variable: ScheduleVariable;
    contains: ScheduleDynamicParameter;
  }

  interface ScheduleConditionVariableStartsWith {
    type: 'variable_starts_with';
    variable: ScheduleVariable;
    startsWith: ScheduleDynamicParameter;
  }

  interface ScheduleConditionVariableEndsWith {
    type: 'variable_ends_with';
    variable: ScheduleVariable;
    endsWith: ScheduleDynamicParameter;
  }

  type ScheduleCondition =
    | ScheduleConditionNone
    | ScheduleConditionAnd
    | ScheduleConditionOr
    | ScheduleConditionNot
    | ScheduleConditionVariableExists
    | ScheduleConditionVariableEquals
    | ScheduleConditionVariableContains
    | ScheduleConditionVariableStartsWith
    | ScheduleConditionVariableEndsWith;

  interface ScheduleActionSleep {
    type: 'sleep';
    duration: number;
  }

  interface ScheduleActionEnsure {
    type: 'ensure';
    condition: ScheduleCondition;
  }

  interface ScheduleActionFormat {
    type: 'format';
    format: string;
    outputInto: ScheduleVariable;
  }

  interface ScheduleActionMatchRegex {
    type: 'match_regex';
    input: ScheduleDynamicParameter;
    regex: string;
    outputInto: (ScheduleVariable | null)[];
  }

  interface ScheduleActionWaitForConsoleLine {
    type: 'wait_for_console_line';
    ignoreFailure: boolean;
    contains: ScheduleDynamicParameter;
    timeout: number;
    outputInto: ScheduleVariable | null;
  }

  interface ScheduleActionSendPower {
    type: 'send_power';
    ignoreFailure: boolean;
    action: ServerPowerAction;
  }

  interface ScheduleActionSendCommand {
    type: 'send_command';
    ignoreFailure: boolean;
    command: ScheduleDynamicParameter;
  }

  interface ScheduleActionCreateBackup {
    type: 'create_backup';
    ignoreFailure: boolean;
    foreground: boolean;
    name: ScheduleDynamicParameter | null;
    ignoredFiles: string[];
  }

  interface ScheduleActionCreateDirectory {
    type: 'create_directory';
    ignoreFailure: boolean;
    root: ScheduleDynamicParameter;
    name: ScheduleDynamicParameter;
  }

  interface ScheduleActionWriteFile {
    type: 'write_file';
    ignoreFailure: boolean;
    append: boolean;
    file: ScheduleDynamicParameter;
    content: ScheduleDynamicParameter;
  }

  interface ScheduleActionCopyFile {
    type: 'copy_file';
    ignoreFailure: boolean;
    foreground: boolean;
    file: ScheduleDynamicParameter;
    destination: ScheduleDynamicParameter;
  }

  interface ScheduleActionDeleteFiles {
    type: 'delete_files';
    root: ScheduleDynamicParameter;
    files: string[];
  }

  interface ScheduleActionRenameFiles {
    type: 'rename_files';
    root: ScheduleDynamicParameter;
    files: {
      from: string;
      to: string;
    }[];
  }

  interface ScheduleActionCompressFiles {
    type: 'compress_files';
    ignoreFailure: boolean;
    foreground: boolean;
    root: ScheduleDynamicParameter;
    files: string[];
    format: ArchiveFormat;
    name: ScheduleDynamicParameter;
  }

  interface ScheduleActionDecompressFile {
    type: 'decompress_file';
    ignoreFailure: boolean;
    foreground: boolean;
    root: ScheduleDynamicParameter;
    file: ScheduleDynamicParameter;
  }

  interface ScheduleActionUpdateStartupVariable {
    type: 'update_startup_variable';
    ignoreFailure: boolean;
    envVariable: ScheduleDynamicParameter;
    value: ScheduleDynamicParameter;
  }

  interface ScheduleActionUpdateStartupCommand {
    type: 'update_startup_command';
    ignoreFailure: boolean;
    command: ScheduleDynamicParameter;
  }

  interface ScheduleActionUpdateStartupDockerImage {
    type: 'update_startup_docker_image';
    ignoreFailure: boolean;
    image: ScheduleDynamicParameter;
  }

  type ScheduleAction =
    | ScheduleActionSleep
    | ScheduleActionEnsure
    | ScheduleActionFormat
    | ScheduleActionMatchRegex
    | ScheduleActionWaitForConsoleLine
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

  interface EnvVariable {
    envVariable: string;
    value: string;
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
  type UserToastPosition = 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';

  interface UpdateUser {
    username: string;
    email: string;
    nameFirst: string;
    nameLast: string;
    password?: string | null;
    admin: boolean;
    totpEnabled: boolean;
    language: string;
    roleUuid: string;
  }

  interface User extends UpdateUser {
    uuid: string;
    role: Role;
    avatar?: string;
    toastPosition: UserToastPosition;
    startOnGroupedServers: boolean;
    created: Date;
  }

  interface UserActivity {
    event: string;
    ip: string;
    data: object | null;
    isApi: boolean;
    created: Date;
  }

  interface UpdateUserApiKey {
    name: string;
    userPermissions: string[];
    serverPermissions: string[];
    adminPermissions: string[];
  }

  interface UserApiKey extends UpdateUserApiKey {
    uuid: string;
    keyStart: string;
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

  type BackupDisk = 'local' | 's3' | 'ddup-bak' | 'btrfs' | 'zfs' | 'restic';

  interface BackupDiskConfigurationS3 {
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
    endpoint: string;
    pathStyle: boolean;
    partSize: number;
  }

  interface BackupDiskConfigurationRestic {
    repository: string;
    retryLockSeconds: number;
    environment: Record<string, string>;
  }

  interface BackupDiskConfigurations {
    s3: BackupDiskConfigurationS3;
    restic: BackupDiskConfigurationRestic;
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

  type MailModeType = 'none' | 'smtp' | 'sendmail' | 'filesystem';

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

  interface MailModeSendmail {
    type: 'sendmail';
    command: string;
    fromAddress: string;
    fromName: string | null;
  }

  interface MailModeFilesystem {
    type: 'filesystem';
    path: string;
    fromAddress: string;
    fromName: string | null;
  }

  type MailMode = MailModeNone | MailModeSmtp | MailModeSendmail | MailModeFilesystem;

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
    oobeStep: OobeStepKey | null;
    captchaProvider: PublicCaptchaProvider;
    app: {
      url: string;
      name: string;
      language: string;
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
    oobeStep: OobeStepKey | null;
    storageDriver: StorageDriver;
    mailMode: MailMode;
    captchaProvider: CaptchaProvider;
    app: {
      name: string;
      url: string;
      language: string;
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

  type ServerBackupStatus = 'starting' | 'finished' | 'failed';

  type ServerStatus = 'installing' | 'install_failed' | 'restoring_backup';

  interface PermissionMap {
    [category: string]: {
      description: string;
      permissions: Record<string, string>;
    };
  }

  interface ApiPermissions {
    userPermissions: PermissionMap;
    serverPermissions: PermissionMap;
    adminPermissions: PermissionMap;
  }

  type ArchiveFormat = 'tar' | 'tar_gz' | 'tar_xz' | 'tar_bz2' | 'tar_lz4' | 'tar_zstd' | 'zip' | 'seven_zip';
  type StreamingArchiveFormat = 'tar' | 'tar_gz' | 'tar_xz' | 'tar_bz2' | 'tar_lz4' | 'tar_zstd' | 'zip';
  type OobeStepKey = 'register' | 'configuration' | 'location' | 'node' | 'node_verify' | 'finished' | '';

  type GroupedDatabaseHosts = {
    [key in DatabaseType]: {
      group: string;
      items: { value: string; label: string }[];
    };
  };
}
