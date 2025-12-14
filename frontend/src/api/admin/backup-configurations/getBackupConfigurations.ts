import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<BackupConfiguration>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/backup-configurations', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.backupConfigurations))
      .catch(reject);
  });
};
