import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import {
  adminBackupConfigurationResticSchema,
  adminBackupConfigurationS3Schema,
  adminBackupConfigurationSchema,
} from '@/lib/schemas/admin/backupConfigurations';

interface Data extends z.infer<typeof adminBackupConfigurationSchema> {
  backupConfigs: {
    s3: z.infer<typeof adminBackupConfigurationS3Schema> | null;
    restic: z.infer<typeof adminBackupConfigurationResticSchema> | null;
  };
}

export default async (data: Data): Promise<BackupConfiguration> => {
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
