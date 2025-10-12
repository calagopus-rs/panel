import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateBackupConfiguration): Promise<BackupConfiguration> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/backup-configurations', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.backupConfiguration))
      .catch(reject);
  });
};
