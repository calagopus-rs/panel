import { z } from 'zod';

export const adminServerCreateSchema = z.object({
  externalId: z.string().max(255).nullable(),
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  startOnCompletion: z.boolean(),
  skipInstaller: z.boolean(),
  limits: z.object({
    cpu: z.number().min(0),
    memory: z.number().min(0),
    swap: z.number().min(-1),
    disk: z.number().min(0),
    ioWeight: z.number().min(0).max(1000).nullable(),
  }),
  pinnedCpus: z.array(z.number()),
  startup: z.string().min(1).max(8192),
  image: z.string().min(2).max(255),
  timezone: z.string().min(3).max(255),
  featureLimits: z.object({
    allocations: z.number().min(0),
    databases: z.number().min(0),
    backups: z.number().min(0),
    schedules: z.number().min(0),
  }),
  nodeUuid: z.uuid(),
  ownerUuid: z.uuid(),
  eggUuid: z.uuid(),
  backupConfigurationUuid: z.uuid().nullable(),
  allocationUuid: z.uuid().nullable(),
  allocationUuids: z.array(z.uuid()),
  variables: z.array(
    z.object({
      envVariable: z.string().min(1).max(255),
      value: z.string().max(4096),
    }),
  ),
});

export const adminServerUpdateSchema = z.object({
  ownerUuid: z.uuid(),
  eggUuid: z.uuid(),
  backupConfigurationUuid: z.uuid().nullable(),
  externalId: z.string().max(255).nullable(),
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  limits: z.object({
    cpu: z.number().min(0),
    memory: z.number().min(0),
    swap: z.number().min(-1),
    disk: z.number().min(0),
    ioWeight: z.number().min(0).max(1000).nullable(),
  }),
  pinnedCpus: z.array(z.number()),
  startup: z.string().min(1).max(8192),
  image: z.string().min(2).max(255),
  timezone: z.string().min(3).max(255),
  featureLimits: z.object({
    allocations: z.number().min(0),
    databases: z.number().min(0),
    backups: z.number().min(0),
    schedules: z.number().min(0),
  }),
});
