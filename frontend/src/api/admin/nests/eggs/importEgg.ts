import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, data: object): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/import`, data)
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
