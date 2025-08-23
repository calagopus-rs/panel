import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<DatabaseHost[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/databases/hosts`)
      .then(({ data }) => resolve(data.databaseHosts))
      .catch(reject);
  });
};
