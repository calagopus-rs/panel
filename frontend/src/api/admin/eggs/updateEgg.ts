import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nest: number, egg: number, data: AdminUpdateNestEgg): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nest}/eggs/${egg}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
