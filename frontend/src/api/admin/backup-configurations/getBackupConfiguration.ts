import { axiosInstance } from '@/api/axios.ts';

export default async (backupConfigUuid: string): Promise<BackupConfiguration> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/backup-configurations/${backupConfigUuid}`)
      .then(({ data }) => resolve(data.backupConfiguration))
      .catch(reject);
  });
};
