import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string): Promise<Nest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}`)
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
