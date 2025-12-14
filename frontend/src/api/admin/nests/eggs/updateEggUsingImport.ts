import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, nestEggUuid: string, data: object): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${nestEggUuid}/update/import`, data)
      .then(() => resolve())
      .catch(reject);
  });
};
