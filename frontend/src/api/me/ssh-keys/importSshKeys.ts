import { axiosInstance } from '@/api/axios';

export default async (provider: SshKeyProvider, username: string): Promise<UserSshKey[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/ssh-keys/import', { provider, username })
      .then(({ data }) => resolve(data.sshKeys))
      .catch(reject);
  });
};
