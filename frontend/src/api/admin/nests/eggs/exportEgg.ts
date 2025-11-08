import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, eggUuid: string): Promise<object> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/export`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
