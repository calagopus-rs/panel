import { axiosInstance } from '@/api/axios';

interface Data {
  truncateDirectory: boolean;
}

export default async (uuid: string, backup: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups/${backup}/restore`, {
        truncate_directory: data.truncateDirectory,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
