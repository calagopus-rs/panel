import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

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
