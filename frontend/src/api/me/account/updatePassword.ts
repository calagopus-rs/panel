import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Data {
  password: string;
  newPassword: string;
}

export default async (data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/client/account/password', transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
