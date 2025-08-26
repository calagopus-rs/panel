import { axiosInstance } from '@/api/axios';

export default async (sshKeyUuid: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/account/ssh-keys/${sshKeyUuid}`, { name })
      .then(() => resolve())
      .catch(reject);
  });
};
