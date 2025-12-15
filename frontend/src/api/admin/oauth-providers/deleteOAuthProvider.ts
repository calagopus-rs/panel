import { axiosInstance } from '@/api/axios.ts';

export default async (oauthProviderUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/oauth-providers/${oauthProviderUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
