import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  shortName: string;
  name: string;
  description: string;
  backupDisk: LocationConfigBackupType;
  backupConfigs: {
    [x: string]: LocationConfigBackup;
  };
}

export default async (data: Data): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/locations', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
