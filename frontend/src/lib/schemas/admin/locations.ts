import { z } from 'zod';

export const adminLocationSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  backupConfigurationUuid: z.uuid().nullable(),
});
