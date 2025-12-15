import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, eggUuid: string): Promise<NestEggVariable[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables`)
      .then(({ data }) => resolve(data.variables))
      .catch(reject);
  });
};
