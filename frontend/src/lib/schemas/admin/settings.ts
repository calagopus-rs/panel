import { z } from 'zod';

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
