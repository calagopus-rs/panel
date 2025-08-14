import { axiosInstance } from '@/api/axios';

export default async (nest: number): Promise<Nest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nest}`)
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
