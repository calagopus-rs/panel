import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: AdminUpdateNest): Promise<AdminNest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nests', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
