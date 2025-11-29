import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: AdminUpdateEggRepository): Promise<AdminEggRepository> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/egg-repositories', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.eggRepository))
      .catch(reject);
  });
};
