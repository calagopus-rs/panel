import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/settings/install/cancel`)
      .then(() => resolve())
      .catch(reject);
  });
};
