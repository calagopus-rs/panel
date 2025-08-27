import { axiosInstance } from '@/api/axios';

interface Data {
  locked: boolean;
}

export default async (uuid: string, databaseUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/databases/${databaseUuid}`, {
        locked: data.locked,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
