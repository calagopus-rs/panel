import { axiosInstance } from '@/api/axios';

export default async (uuid: string, backup: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/backups/${backup}`)
      .then(() => resolve())
      .catch(reject);
  });
};
