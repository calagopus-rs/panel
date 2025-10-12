import { axiosInstance } from '@/api/axios';

export default async (backupConfigUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/backup-configurations/${backupConfigUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
