import { z } from 'zod';

export const adminMountSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  source: z.string().min(1).max(255),
  target: z.string().min(1).max(255),
  readOnly: z.boolean(),
  userMountable: z.boolean(),
});
