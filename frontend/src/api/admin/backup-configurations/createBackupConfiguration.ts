import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminBackupConfigurationSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminBackupConfigurationSchema>): Promise<BackupConfiguration> => {
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
