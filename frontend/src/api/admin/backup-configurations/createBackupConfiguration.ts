import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateBackupConfiguration): Promise<BackupConfiguration> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/backup-configurations', {
        ...transformKeysToSnakeCase(data),
        backup_configs: data.backupConfigs
          ? {
              ...transformKeysToSnakeCase(data.backupConfigs),
              restic: data.backupConfigs.restic
                ? {
                    ...transformKeysToSnakeCase(data.backupConfigs.restic),
                    environment: data.backupConfigs.restic.environment,
                  }
                : null,
            }
          : null,
      })
      .then(({ data }) => resolve(data.backupConfiguration))
      .catch(reject);
  });
};
