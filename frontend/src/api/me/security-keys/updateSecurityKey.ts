import { axiosInstance } from '@/api/axios';

export default async (securityKeyUuid: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/account/security-keys/${securityKeyUuid}`, { name })
      .then(() => resolve())
      .catch(reject);
  });
};
