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

export const ScheduleComparatorOperatorMapping: Record<ScheduleComparator, string> = {
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
