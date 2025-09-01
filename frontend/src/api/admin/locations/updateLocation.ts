import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (locationUuid: string, data: UpdateLocation): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${locationUuid}`, {
        ...transformKeysToSnakeCase<object>(data),
        backup_configs: data.backupConfigs
          ? {
              ...transformKeysToSnakeCase<object>(data.backupConfigs),
              restic: data.backupConfigs.restic
                ? {
                    ...transformKeysToSnakeCase<object>(data.backupConfigs.restic),
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
