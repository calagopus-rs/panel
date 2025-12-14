import { axiosInstance } from '@/api/axios.ts';

export default async (oauthLinkUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/oauth-links/${oauthLinkUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
