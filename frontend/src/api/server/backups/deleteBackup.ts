import { axiosInstance } from '@/api/axios';

export default async (uuid: string, backupUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/backups/${backupUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
