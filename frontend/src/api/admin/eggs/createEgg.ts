import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nest: number, data: AdminUpdateNestEgg): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nest}/eggs`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
