import { axiosInstance } from '@/api/axios';

export default async (nest: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nests/${nest}`)
      .then(() => resolve())
      .catch(reject);
  });
};
