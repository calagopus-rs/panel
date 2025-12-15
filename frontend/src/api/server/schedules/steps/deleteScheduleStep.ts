import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, scheduleUuid: string, stepUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps/${stepUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
