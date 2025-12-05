import { z } from 'zod';

export const adminBackupConfigurationS3Schema = z.object({
  accessKey: z.string(),
  secretKey: z.string(),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string(),
  pathStyle: z.boolean(),
  partSize: z.number().min(0),
});

export const adminBackupConfigurationResticSchema = z.object({
  repository: z.string(),
  retryLockSeconds: z.number().min(0),
  environment: z.record(z.string(), z.string()),
});

export const adminBackupConfigurationSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  backupDisk: z.enum(['local', 's3', 'ddup-bak', 'btrfs', 'zfs', 'restic']),
});

export const adminDatabaseHostSchema = z.object({
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

export const adminEggRepositorySchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  gitRepository: z.url(),
});

export const adminLocationSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  backupConfigurationUuid: z.uuid().nullable(),
});

export const adminMountSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  source: z.string().min(1).max(255),
  target: z.string().min(1).max(255),
  readOnly: z.boolean(),
  userMountable: z.boolean(),
});

export const adminNestSchema = z.object({
  author: z.string().min(2).max(255),
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
});

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

export const adminNodeAllocationsSchema = z.object({
  ip: z.string(),
  ipAlias: z.string().min(1).max(255).nullable(),
  ports: z.array(z.string()),
});

export const adminNodeSchema = z.object({
  locationUuid: z.uuid(),
  backupConfigurationUuid: z.uuid().nullable(),
  name: z.string().min(3).max(255),
  public: z.boolean(),
  description: z.string().max(1024).nullable(),
  publicUrl: z.url().min(3).max(255).nullable(),
  url: z.url().min(3).max(255),
  sftpHost: z.string().min(3).max(255).nullable(),
  sftpPort: z.number().min(0).max(65535),
  maintenanceMessage: z.string().max(1024).nullable(),
  memory: z.number().min(0),
  disk: z.number().min(0),
});

export const adminOAuthProviderSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  clientId: z.string().min(3).max(255),
  clientSecret: z.string().min(3).max(255),
  authUrl: z.string().min(3).max(255),
  tokenUrl: z.string().min(3).max(255),
  infoUrl: z.string().min(3).max(255),
  scopes: z.array(z.string()),
  identifierPath: z.string().min(3).max(255),
  emailPath: z.string().min(3).max(255).nullable(),
  usernamePath: z.string().min(3).max(255).nullable(),
  nameFirstPath: z.string().min(3).max(255).nullable(),
  nameLastPath: z.string().min(3).max(255).nullable(),
  enabled: z.boolean(),
  loginOnly: z.boolean(),
  linkViewable: z.boolean(),
  userManageable: z.boolean(),
  basicAuth: z.boolean(),
});

export const adminRoleSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1024).nullable(),
  adminPermissions: z.array(z.string()),
  serverPermissions: z.array(z.string()),
});

export const adminServerSchema = z.object({
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

export const adminSettingsApplicationSchema = z.object({
  name: z.string(),
  url: z.string(),
  telemetryEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
});

export const adminSettingsCaptchaProviderNoneSchema = z.object({
  type: z.literal('none'),
});

export const adminSettingsCaptchaProviderTurnstileSchema = z.object({
  type: z.literal('turnstile'),
  siteKey: z.string(),
  secretKey: z.string(),
});

export const adminSettingsCaptchaProviderRecaptchaSchema = z.object({
  type: z.literal('recaptcha'),
  siteKey: z.string(),
  secretKey: z.string(),
  v3: z.boolean(),
});

export const adminSettingsCaptchaProviderSchema = z.discriminatedUnion('type', [
  adminSettingsCaptchaProviderNoneSchema,
  adminSettingsCaptchaProviderTurnstileSchema,
  adminSettingsCaptchaProviderRecaptchaSchema,
]);

export const adminSettingsEmailNoneSchema = z.object({
  type: z.literal('none'),
});

export const adminSettingsEmailSmtpSchema = z.object({
  type: z.literal('smtp'),
  host: z.string(),
  port: z.number(),
  username: z.string().nullable(),
  password: z.string().nullable(),
  useTls: z.boolean(),
  fromAddress: z.string(),
  fromName: z.string().nullable(),
});

export const adminSettingsEmailSendmailSchema = z.object({
  type: z.literal('sendmail'),
  command: z.string(),
  fromAddress: z.string(),
  fromName: z.string().nullable(),
});

export const adminSettingsEmailFilesystemSchema = z.object({
  type: z.literal('filesystem'),
  path: z.string(),
  fromAddress: z.string(),
  fromName: z.string().nullable(),
});

export const adminSettingsEmailSchema = z.discriminatedUnion('type', [
  adminSettingsEmailNoneSchema,
  adminSettingsEmailSmtpSchema,
  adminSettingsEmailSendmailSchema,
  adminSettingsEmailFilesystemSchema,
]);

export const adminSettingsServerSchema = z.object({
  maxFileManagerViewSize: z.number().min(0),
  maxSchedulesStepCount: z.number().min(0),
  allowOverwritingCustomDockerImage: z.boolean(),
  allowEditingStartupCommand: z.boolean(),
});

export const adminSettingsStorageFilesystemSchema = z.object({
  type: z.literal('filesystem'),
  path: z.string(),
});

export const adminSettingsStorageS3Schema = z.object({
  type: z.literal('s3'),
  publicUrl: z.string(),
  accessKey: z.string(),
  secretKey: z.string(),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string(),
  pathStyle: z.boolean(),
});

export const adminSettingsStorageSchema = z.discriminatedUnion('type', [
  adminSettingsStorageFilesystemSchema,
  adminSettingsStorageS3Schema,
]);

export const adminSettingsWebauthnSchema = z.object({
  rpId: z.string(),
  rpOrigin: z.string(),
});

export const oobeConfigurationSchema = z.object({
  applicationName: z.string().min(3).max(255),
  applicationUrl: z.url(),
  applicationTelemetry: z.boolean(),
  applicationRegistration: z.boolean(),
});

export const oobeLocationSchema = z.object({
  locationName: z.string().min(3).max(255),
  backupName: z.string().min(3).max(255),
  backupDisk: z.enum(['local', 's3', 'ddup-bak', 'btrfs', 'zfs', 'restic']),
});

export const oobeLoginSchema = z.object({
  username: z.string(),
  password: z.string().max(512),
});

export const oobeNodeSchema = z.object({
  name: z.string().min(3).max(255),
  publicUrl: z.url().nullable(),
  url: z.url().min(3).max(255),
  sftpHost: z.string().nullable(),
  sftpPort: z.number().min(1).max(65535),
  memory: z.number(),
  disk: z.number(),
});

export const oobeRegister = z
  .object({
    username: z
      .string()
      .min(3)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.email(),
    nameFirst: z.string().min(2).max(255),
    nameLast: z.string().min(2).max(255),
    password: z.string().min(8).max(512),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const authForgotPasswordSchema = z.object({
  email: z.email(),
});

export const authRegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.email(),
  nameFirst: z.string().min(2).max(255),
  nameLast: z.string().min(2).max(255),
  password: z.string().min(8).max(512),
});

export const authResetPasswordSchema = z
  .object({
    password: z.string().min(8).max(512),
    confirmPassword: z.string().min(8).max(512),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });


export const authUsernameSchema = z.object({
  username: z.string().nonempty(),
});

export const authPasswordSchema = z.object({
  password: z.string().max(512),
});

export const authTotpSchema = z.object({
  code: z.string().min(6).max(10),
});
