import { z } from 'zod';

export const adminBackupConfigurationResticSchema = z.object({
  repository: z.string(),
  retryLockSeconds: z.number().min(0),
  environment: z.record(z.string(), z.string()),
});

export const adminBackupConfigurationS3Schema = z.object({
  accessKey: z.string(),
  secretKey: z.string(),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string(),
  pathStyle: z.boolean(),
  partSize: z.number().min(0),
});

export const adminBackupConfigurationSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  backupDisk: z.enum(['local', 's3', 'ddup-bak', 'btrfs', 'zfs', 'restic']),
});
