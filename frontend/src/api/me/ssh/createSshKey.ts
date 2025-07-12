import { axiosInstance } from '@/api/axios';

export default async (name: string, publicKey: string): Promise<UserSshKey> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/account/ssh-keys`, { name, public_key: publicKey })
      .then(({ data }) => resolve(data.sshKey))
      .catch(reject);
  });
};
