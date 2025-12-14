import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Data {
  name: string;
  publicKey: string;
}

export default async (data: Data): Promise<UserSshKey> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/ssh-keys', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.sshKey))
      .catch(reject);
  });
};
