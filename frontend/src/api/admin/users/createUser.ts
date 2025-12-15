import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (data: UpdateUser): Promise<User> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/users', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.user))
      .catch(reject);
  });
};
