import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string): Promise<AdminNest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}`)
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
