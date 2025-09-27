import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string): Promise<ServerVariable[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}/variables`)
      .then(({ data }) => resolve(data.variables))
      .catch(reject);
  });
};
