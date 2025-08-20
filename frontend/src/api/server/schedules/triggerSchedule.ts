import { axiosInstance } from '@/api/axios';

export default async (uuid: string, schedule: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules/${schedule}/trigger`)
      .then(() => resolve())
      .catch(reject);
  });
};
