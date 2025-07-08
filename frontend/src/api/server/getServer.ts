import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<ApiServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}`)
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
