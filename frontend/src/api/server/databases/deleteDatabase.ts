import { axiosInstance } from '@/api/axios';

export default async (uuid: string, database: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/databases/${database}`)
      .then(() => resolve())
      .catch(reject);
  });
};
