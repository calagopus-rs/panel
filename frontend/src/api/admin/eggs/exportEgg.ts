import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (nestUuid: string, eggUuid: string): Promise<object> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/export`)
      .then(({ data }) => resolve(transformKeysToSnakeCase(data)))
      .catch(reject);
  });
};
