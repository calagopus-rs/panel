import { axiosInstance } from '@/api/axios';

export default async (keyId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/ssh-keys/${keyId}`)
      .then(() => resolve())
      .catch(reject);
  });
};
