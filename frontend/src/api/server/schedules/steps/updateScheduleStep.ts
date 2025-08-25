import { axiosInstance } from '@/api/axios';

interface Data {
  action: ScheduleAction;
  order: number;
}

export default async (serverUuid: string, scheduleUuid: string, stepUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps/${stepUuid}`, {
        action: data.action,
        order: data.order,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
