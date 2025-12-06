import { z } from 'zod';

export const adminNestSchema = z.object({
  author: z.string().min(2).max(255),
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
});
