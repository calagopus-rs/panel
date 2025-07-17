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

export default async (location: number, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${location}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
