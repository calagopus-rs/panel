import { axiosInstance } from '@/api/axios';

export default async (uuid: string, databaseUuid: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/databases/${databaseUuid}/rotate-password`)
      .then(({ data }) => resolve(data.password))
      .catch(reject);
  });
};
