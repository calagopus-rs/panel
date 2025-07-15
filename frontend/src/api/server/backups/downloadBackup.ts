import { axiosInstance } from '@/api/axios';

export default async (uuid: string, backup: string): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups/${backup}/download`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
