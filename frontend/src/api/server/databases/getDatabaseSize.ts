import { axiosInstance } from '@/api/axios';

export default async (uuid: string, databaseUuid: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases/${databaseUuid}/size`)
      .then(({ data }) => resolve(data.size))
      .catch(reject);
  });
};
