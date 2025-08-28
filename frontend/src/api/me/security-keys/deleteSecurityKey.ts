import { axiosInstance } from '@/api/axios';

export default async (securityKeyUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/security-keys/${securityKeyUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
