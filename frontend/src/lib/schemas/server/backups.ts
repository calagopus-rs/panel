import { z } from 'zod';

export const serverBackupCreateSchema = z.object({
  name: z.string().min(1).max(255),
  ignoredFiles: z.array(z.string()),
});

export const serverBackupEditSchema = z.object({
  name: z.string().min(1).max(255),
  locked: z.boolean(),
});
