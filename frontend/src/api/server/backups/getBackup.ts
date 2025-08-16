import { axiosInstance } from '@/api/axios';

export default async (uuid: string, backupUuid: string): Promise<ServerBackup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups/${backupUuid}`)
      .then(({ data }) => resolve(data.backup))
      .catch(reject);
  });
};
