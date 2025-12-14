import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, scheduleUuid: string, order: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps/order`, { schedule_step_order: order })
      .then(() => resolve())
      .catch(reject);
  });
};
