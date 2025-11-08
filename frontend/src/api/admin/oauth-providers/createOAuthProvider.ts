import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateAdminOAuthProvider): Promise<AdminOAuthProvider> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/oauth-providers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.oauthProvider))
      .catch(reject);
  });
};
