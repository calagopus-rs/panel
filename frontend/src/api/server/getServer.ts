import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string): Promise<Server> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}`)
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
