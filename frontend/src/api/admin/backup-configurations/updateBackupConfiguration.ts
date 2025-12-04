import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import {
  adminBackupConfigurationResticSchema,
  adminBackupConfigurationS3Schema,
  adminBackupConfigurationSchema
} from "@/lib/schemas";
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data extends z.infer<typeof adminBackupConfigurationSchema> {
  backupConfigs: {
    s3: z.infer<typeof adminBackupConfigurationS3Schema>;
    restic: z.infer<typeof adminBackupConfigurationResticSchema>;
  };
}

export default async (backupConfigUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/backup-configurations/${backupConfigUuid}`, {
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
      .then(() => resolve())
      .catch(reject);
  });
};
