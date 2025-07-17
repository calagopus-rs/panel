import { axiosInstance } from '@/api/axios';

interface Data {
  shortName: string;
  name: string;
  description: string;
  backupDisk: LocationConfigBackupType;
  backupConfigs: LocationConfigBackup;
}

export default async (location: number, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${location}`, {
        short_name: data.shortName,
        name: data.name,
        description: data.description,
        backup_disk: data.backupDisk,
        backup_configs: data.backupConfigs,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
