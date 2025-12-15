import { axiosInstance } from '@/api/axios.ts';

interface Data {
  provider: SshKeyProvider;
  username: string;
}

export default async (data: Data): Promise<UserSshKey[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/ssh-keys/import', data)
      .then(({ data }) => resolve(data.sshKeys))
      .catch(reject);
  });
};
