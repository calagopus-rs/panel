import { axiosInstance } from '@/api/axios';

interface Data {
  action: ScheduleAction;
  order: number;
}

export default async (serverUuid: string, scheduleUuid: string, data: Data): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps`, {
        action: data.action,
        order: data.order,
      })
      .then(({ data }) => resolve(data.subuser))
      .catch(reject);
  });
};
