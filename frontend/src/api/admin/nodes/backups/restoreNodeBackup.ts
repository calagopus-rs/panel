import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Data {
  serverUuid: string;
  truncateDirectory: boolean;
}

export default async (nodeUuid: string, backupUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nodes/${nodeUuid}/backups/${backupUuid}/restore`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
