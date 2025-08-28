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

export const locationConfigBackupDiskLabelMapping: Record<LocationConfigBackupDisk, string> = {
  local: 'Local',
  s3: 'S3',
  'ddup-bak': 'Ddup-Bak',
  btrfs: 'Btrfs',
  zfs: 'ZFS',
  restic: 'Restic',
};

export const mailModeTypeLabelMapping: Record<MailModeType, string> = {
  none: 'None',
  smtp: 'SMTP',
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

export const scheduleStepIconMapping: Record<ScheduleAction['type'], IconDefinition> = {
  sleep: faHourglass,
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
