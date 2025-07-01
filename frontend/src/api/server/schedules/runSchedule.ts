import { axiosInstance } from '@/api/axios';

export default async (uuid: string, schedule: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules/${schedule}/execute`)
      .then(() => resolve())
      .catch(reject);
  });
};
