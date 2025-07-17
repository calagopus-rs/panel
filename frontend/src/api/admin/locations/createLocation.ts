import { axiosInstance } from '@/api/axios';

interface Data {
  shortName: string;
  name: string;
  description: string;
  backupDisk: LocationConfigBackupType;
  backupConfigs: LocationConfigBackup;
}

export default async (data: Data): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/locations`, {
        short_name: data.shortName,
        name: data.name,
        description: data.description,
        backup_disk: data.backupDisk,
        backup_configs: data.backupConfigs,
      })
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
