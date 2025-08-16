import { axiosInstance } from '@/api/axios';

interface Data {
  truncateDirectory: boolean;
}

export default async (uuid: string, backupUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups/${backupUuid}/restore`, {
        truncate_directory: data.truncateDirectory,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
