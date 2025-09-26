import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, scheduleUuid: string, skipCondition: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/trigger`, { skip_condition: skipCondition })
      .then(() => resolve())
      .catch(reject);
  });
};
