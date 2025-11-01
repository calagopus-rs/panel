import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, eggUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
