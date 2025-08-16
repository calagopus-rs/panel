import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  locked: boolean;
}

export default async (uuid: string, backupUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/backups/${backupUuid}`, {
        name: data.name,
        locked: data.locked,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
