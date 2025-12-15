import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (data: AdminUpdateEggRepository): Promise<AdminEggRepository> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/egg-repositories', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.eggRepository))
      .catch(reject);
  });
};
