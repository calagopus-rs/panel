import { z } from 'zod';

export const adminDatabaseHostCreateSchema = z.object({
  name: z.string().min(3).max(255),
  username: z.string().min(3).max(255),
  password: z.string().min(1).max(512),
  host: z.string().min(3).max(255),
  port: z.number().min(0).max(65535),
  public: z.boolean(),
  publicHost: z.string().min(3).max(255).nullable(),
  publicPort: z.number().min(0).max(65535).nullable(),
  type: z.enum(['mysql', 'postgres']),
});

export const adminDatabaseHostUpdateSchema = z.object({
  name: z.string().min(3).max(255),
  username: z.string().min(3).max(255),
  password: z.string().min(1).max(512).nullable(),
  host: z.string().min(3).max(255),
  port: z.number().min(0).max(65535),
  public: z.boolean(),
  publicHost: z.string().min(3).max(255).nullable(),
  publicPort: z.number().min(0).max(65535).nullable(),
  type: z.enum(['mysql', 'postgres']),
});
