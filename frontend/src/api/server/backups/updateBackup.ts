import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  locked: boolean;
}

export default async (uuid: string, backup: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/backups/${backup}`, {
        name: data.name,
        locked: data.locked,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
