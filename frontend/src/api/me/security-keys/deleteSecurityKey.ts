import { axiosInstance } from '@/api/axios.ts';

export default async (securityKeyUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/security-keys/${securityKeyUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
