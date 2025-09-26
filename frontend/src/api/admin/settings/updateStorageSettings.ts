import { axiosInstance } from '@/api/axios';

export default async (data: StorageDriver): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        storage_driver: data,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
