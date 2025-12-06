import { z } from 'zod';

export const adminEggSchema = z.object({
  eggRepositoryEggUuid: z.uuid().nullable(),
  author: z.string().min(2).max(255),
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  configFiles: z.array(
    z.object({
      file: z.string(),
      parser: z.enum(['file', 'yaml', 'properties', 'ini', 'json', 'xml']),
      replace: z.array(
        z.object({
          match: z.string(),
          ifValue: z.string().nullable(),
          replaceWith: z.string(),
        }),
      ),
    }),
  ),
  configStartup: z.object({
    done: z.array(z.string()),
    stripAnsi: z.boolean(),
  }),
  configStop: z.object({
    type: z.string(),
    value: z.string().nullable(),
  }),
  configScript: z.object({
    container: z.string(),
    entrypoint: z.string(),
    content: z.string(),
  }),
  configAllocations: z.object({
    userSelfAssign: z.object({
      enabled: z.boolean(),
      requirePrimaryAllocation: z.boolean(),
      startPort: z.number().min(0).max(65535),
      endPort: z.number().min(0).max(65535),
    }),
  }),
  startup: z.string().min(1).max(4096),
  forceOutgoingIp: z.boolean(),
  separatePort: z.boolean(),
  features: z.array(z.string()),
  dockerImages: z.record(z.string(), z.string()),
  fileDenylist: z.array(z.string()),
});

export const adminEggVariableSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  order: z.number(),
  envVariable: z.string().min(1).max(255),
  defaultValue: z.string().max(1024).nullable(),
  userViewable: z.boolean(),
  userEditable: z.boolean(),
  rules: z.array(z.string()),
});
