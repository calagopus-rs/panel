import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  name: string;
  ignoredFiles: string[];
}

export default async (uuid: string, data: Data): Promise<ServerBackup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.backup))
      .catch(reject);
  });
};
