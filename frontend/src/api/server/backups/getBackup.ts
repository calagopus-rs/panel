import { axiosInstance } from '@/api/axios';

export default async (uuid: string, backup: string): Promise<ServerBackup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups/${backup}`)
      .then(({ data }) => resolve(data.backup))
      .catch(reject);
  });
};
