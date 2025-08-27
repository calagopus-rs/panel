import { axiosInstance } from '@/api/axios';

export default async (apiKeyUuid: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/account/api-keys/${apiKeyUuid}`, { name })
      .then(() => resolve())
      .catch(reject);
  });
};
