import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  truncateDirectory: boolean;
}

export default async (uuid: string, backupUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups/${backupUuid}/restore`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
