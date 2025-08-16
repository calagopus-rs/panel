import { axiosInstance } from '@/api/axios';

export default async (uuid: string, databaseUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/databases/${databaseUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
