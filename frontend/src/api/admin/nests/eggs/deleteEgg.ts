import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, eggUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
