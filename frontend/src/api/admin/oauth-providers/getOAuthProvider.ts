import { axiosInstance } from '@/api/axios.ts';

export default async (oauthProviderUuid: string): Promise<AdminOAuthProvider> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/oauth-providers/${oauthProviderUuid}`)
      .then(({ data }) => resolve(data.oauthProvider))
      .catch(reject);
  });
};
