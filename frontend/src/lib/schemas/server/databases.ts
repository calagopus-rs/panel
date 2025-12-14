import { z } from 'zod';

export const serverDatabaseCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(31)
    .regex(/^[a-zA-Z0-9_]+$/),
  databaseHostUuid: z.uuid(),
});

export const serverDatabaseEditSchema = z.object({
  locked: z.boolean(),
});
