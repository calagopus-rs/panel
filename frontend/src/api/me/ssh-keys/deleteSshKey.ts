import { axiosInstance } from '@/api/axios';

export default async (sshKeyUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/ssh-keys/${sshKeyUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
