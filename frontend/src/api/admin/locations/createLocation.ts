import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateLocation): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/locations', {
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
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
