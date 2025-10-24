import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateRole): Promise<Role> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/roles', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.role))
      .catch(reject);
  });
};
