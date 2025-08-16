import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, eggUuid: string): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}`)
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
