import { z } from 'zod';

export const serverAllocationsEditSchema = z.object({
  notes: z.string().max(1024).nullable(),
});
