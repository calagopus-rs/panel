import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<ServerVariable[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/startup/variables`)
      .then(({ data }) => resolve(data.variables))
      .catch(reject);
  });
};
