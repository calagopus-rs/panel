import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, scheduleUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/abort`)
      .then(() => resolve())
      .catch(reject);
  });
};
