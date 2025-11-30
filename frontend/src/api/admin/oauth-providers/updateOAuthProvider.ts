import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminOAuthProviderSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (oauthProviderUuid: string, data: z.infer<typeof adminOAuthProviderSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/oauth-providers/${oauthProviderUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
