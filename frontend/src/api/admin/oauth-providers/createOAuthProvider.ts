import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminOAuthProviderSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminOAuthProviderSchema>): Promise<AdminOAuthProvider> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/oauth-providers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.oauthProvider))
      .catch(reject);
  });
};
