import { axiosInstance } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<AdminOAuthProvider>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/oauth-providers', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.oauthProviders))
      .catch(reject);
  });
};
