import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, nestEggUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${nestEggUuid}/update/repository`)
      .then(() => resolve())
      .catch(reject);
  });
};
