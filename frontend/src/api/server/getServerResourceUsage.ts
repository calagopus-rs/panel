import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string): Promise<ResourceUsage> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/resources`)
      .then(({ data }) => resolve(data.resources))
      .catch(reject);
  });
};
