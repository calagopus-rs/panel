import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: StorageDriver): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        storage_driver: transformKeysToSnakeCase(data),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
