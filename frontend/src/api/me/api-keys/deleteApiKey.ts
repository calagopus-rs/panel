import { axiosInstance } from '@/api/axios';

export default async (apiKeyUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/api-keys/${apiKeyUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
