import { axiosInstance } from '@/api/axios';

export default async (nest: number, egg: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nests/${nest}/eggs/${egg}`)
      .then(() => resolve())
      .catch(reject);
  });
};
