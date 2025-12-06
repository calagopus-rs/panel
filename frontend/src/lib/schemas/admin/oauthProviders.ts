import { z } from 'zod';

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
