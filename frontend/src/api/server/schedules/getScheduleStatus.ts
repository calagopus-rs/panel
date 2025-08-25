import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, scheduleUuid: string): Promise<ScheduleStatus> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/status`)
      .then(({ data }) => resolve(data.status))
      .catch(reject);
  });
};
