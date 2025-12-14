import { z } from 'zod';

export const serverSubuserCreateSchema = z.object({
  email: z.email(),
  permissions: z.array(z.string()),
  ignoredFiles: z.array(z.string()),
});
