import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faDocker } from '@fortawesome/free-brands-svg-icons';
import {
  faHourglass,
  faPowerOff,
  faTerminal,
  faDatabase,
  faFolder,
  faFile,
  faCopy,
  faTrash,
  faEdit,
  faCompress,
  faExpand,
  faGear,
  faCode,
  faFolderOpen,
  faUsers,
  faBoxArchive,
  faStopwatch,
  faNetworkWired,
  faPlay,
  faCog,
  faBriefcase,
  faScroll,
  faFileZipper,
  faEarthAmerica,
  faServer,
  faKiwiBird,
  faEgg,
  faUser,
  faKey,
  faCloud,
  faComputer,
  faUserSecret,
  faUnlockKeyhole,
  faPuzzlePiece,
} from '@fortawesome/free-solid-svg-icons';

export const captchaProviderTypeLabelMapping: Record<CaptchaProvider['type'], string> = {
  none: 'None',
  turnstile: 'Turnstile',
  recaptcha: 'reCAPTCHA',
};

export const compressionLevelLabelMapping: Record<CompressionLevel, string> = {
  best_speed: 'Best Speed',
  good_speed: 'Good Speed',
  good_compression: 'Good Compression',
  best_compression: 'Best Compression',
};

export const databaseTypeLabelMapping: Record<DatabaseType, string> = {
  mysql: 'MySQL',
  postgres: 'PostgreSQL',
};

export const backupDiskLabelMapping: Record<BackupDisk, string> = {
  local: 'Local',
  s3: 'S3',
  'ddup-bak': 'Ddup-Bak',
  btrfs: 'Btrfs',
  zfs: 'ZFS',
  restic: 'Restic',
};

export const storageDriverTypeLabelMapping: Record<StorageDriverType, string> = {
  filesystem: 'Filesystem',
  s3: 'S3',
};

export const mailModeTypeLabelMapping: Record<MailModeType, string> = {
  none: 'None',
  smtp: 'SMTP',
  sendmail: 'Sendmail Command',
  filesystem: 'Filesystem',
};

export const archiveFormatLabelMapping: Record<ArchiveFormat, string> = {
  tar: '.tar',
  tar_gz: '.tar.gz',
  tar_xz: '.tar.xz',
  tar_bz2: '.tar.bz2',
  tar_lz4: '.tar.lz4',
  tar_zstd: '.tar.zst',
  zip: '.zip',
  seven_zip: '.7z',
};

export const streamingArchiveFormatLabelMapping: Record<StreamingArchiveFormat, string> = {
  tar: '.tar',
  tar_gz: '.tar.gz',
  tar_xz: '.tar.xz',
  tar_bz2: '.tar.bz2',
  tar_lz4: '.tar.lz4',
  tar_zstd: '.tar.zst',
  zip: '.zip',
};

export const scheduleConditionLabelMapping: Record<ScheduleCondition['type'], string> = {
  none: 'None',
  and: 'AND (All must be true)',
  or: 'OR (Any must be true)',
  server_state: 'Server State',
  uptime: 'Uptime',
  cpu_usage: 'CPU Usage',
  memory_usage: 'Memory Usage',
  disk_usage: 'Disk Usage',
  file_exists: 'File Exists',
};

export const scheduleComparatorLabelMapping: Record<ScheduleComparator, string> = {
  smaller_than: 'Smaller Than',
  smaller_than_or_equals: 'Smaller Than or Equals',
  equal: 'Equals',
  greater_than: 'Greater Than',
  greater_than_or_equals: 'Greater Than or Equals',
};

export const scheduleComparatorOperatorMapping: Record<ScheduleComparator, string> = {
  smaller_than: '<',
  smaller_than_or_equals: '<=',
  equal: '==',
  greater_than: '>',
  greater_than_or_equals: '>=',
};

export const serverPowerStateLabelMapping: Record<ServerPowerState, string> = {
  running: 'Running',
  offline: 'Offline',
  starting: 'Starting',
  stopping: 'Stopping',
};

export const serverPowerActionLabelMapping: Record<ServerPowerAction, string> = {
  start: 'Start',
  stop: 'Stop',
  restart: 'Restart',
  kill: 'Kill',
};

export const scheduleStepLabelMapping: Record<ScheduleAction['type'], string> = {
  sleep: 'Sleep',
  wait_for_console_line: 'Wait for Console Line',
  send_power: 'Send Power Signal',
  send_command: 'Send Command',
  create_backup: 'Create Backup',
  create_directory: 'Create Directory',
  write_file: 'Write File',
  copy_file: 'Copy File',
  delete_files: 'Delete Files',
  rename_files: 'Rename Files',
  compress_files: 'Compress Files',
  decompress_file: 'Decompress File',
  update_startup_variable: 'Update Startup Variable',
  update_startup_command: 'Update Startup Command',
  update_startup_docker_image: 'Update Docker Image',
};

export const scheduleStepDefaultMapping: Record<ScheduleAction['type'], ScheduleAction> = {
  sleep: {
    type: 'sleep',
    duration: 0,
  },
  wait_for_console_line: {
    type: 'wait_for_console_line',
    ignoreFailure: false,
    contains: '',
    timeout: 5000,
  },
  send_power: {
    type: 'send_power',
    ignoreFailure: false,
    action: 'start',
  },
  send_command: {
    type: 'send_command',
    ignoreFailure: false,
    command: '',
  },
  create_backup: {
    type: 'create_backup',
    ignoreFailure: false,
    foreground: false,
    name: '',
    ignoredFiles: [],
  },
  create_directory: {
    type: 'create_directory',
    ignoreFailure: false,
    root: '/',
    name: '',
  },
  write_file: {
    type: 'write_file',
    ignoreFailure: false,
    append: false,
    file: '/file.txt',
    content: '',
  },
  copy_file: {
    type: 'copy_file',
    ignoreFailure: false,
    foreground: false,
    file: '/source.txt',
    destination: '/destination.txt',
  },
  delete_files: {
    type: 'delete_files',
    root: '/',
    files: [],
  },
  rename_files: {
    type: 'rename_files',
    root: '/',
    files: [],
  },
  compress_files: {
    type: 'compress_files',
    ignoreFailure: false,
    foreground: false,
    root: '/',
    files: [],
    format: 'tar_gz',
    name: 'backup.tar.gz',
  },
  decompress_file: {
    type: 'decompress_file',
    ignoreFailure: false,
    foreground: false,
    root: '/',
    file: 'backup.tar.gz',
  },
  update_startup_variable: {
    type: 'update_startup_variable',
    ignoreFailure: false,
    envVariable: '',
    value: '',
  },
  update_startup_command: {
    type: 'update_startup_command',
    ignoreFailure: false,
    command: '',
  },
  update_startup_docker_image: {
    type: 'update_startup_docker_image',
    ignoreFailure: false,
    image: '',
  },
};

export const scheduleStepIconMapping: Record<ScheduleAction['type'], IconDefinition> = {
  sleep: faHourglass,
  wait_for_console_line: faTerminal,
  send_power: faPowerOff,
  send_command: faTerminal,
  create_backup: faDatabase,
  create_directory: faFolder,
  write_file: faFile,
  copy_file: faCopy,
  delete_files: faTrash,
  rename_files: faEdit,
  compress_files: faCompress,
  decompress_file: faExpand,
  update_startup_variable: faGear,
  update_startup_command: faCode,
  update_startup_docker_image: faDocker,
};

export const sshKeyProviderLabelMapping: Record<SshKeyProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  launchpad: 'Launchpad',
};

export const permissionCategoryIconMapping: Record<string, IconDefinition> = {
  account: faUser,
  activity: faBriefcase,
  allocations: faNetworkWired,
  'api-keys': faCloud,
  'backup-configurations': faFileZipper,
  backups: faBoxArchive,
  control: faTerminal,
  'database-hosts': faDatabase,
  databases: faDatabase,
  eggs: faEgg,
  extensions: faPuzzlePiece,
  files: faFolderOpen,
  locations: faEarthAmerica,
  mounts: faFolder,
  nests: faKiwiBird,
  nodes: faServer,
  roles: faScroll,
  schedules: faStopwatch,
  'security-keys': faUnlockKeyhole,
  servers: faComputer,
  sessions: faUserSecret,
  settings: faCog,
  'ssh-keys': faKey,
  startup: faPlay,
  subusers: faUsers,
  users: faUsers,
};
