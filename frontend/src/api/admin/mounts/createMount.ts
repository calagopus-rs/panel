import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateAdminMount): Promise<Mount> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/mounts', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.mount))
      .catch(reject);
  });
};
