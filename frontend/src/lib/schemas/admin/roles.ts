import { z } from 'zod';

export const adminRoleSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  requireTwoFactor: z.boolean(),
  adminPermissions: z.array(z.string()),
  serverPermissions: z.array(z.string()),
});
