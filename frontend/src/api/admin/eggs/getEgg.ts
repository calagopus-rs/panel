import { axiosInstance } from '@/api/axios';

export default async (nest: number, egg: number): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nest}/eggs/${egg}`)
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
