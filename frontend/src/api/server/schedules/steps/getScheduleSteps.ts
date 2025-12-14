import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, scheduleUuid: string): Promise<ScheduleStep[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps`)
      .then(({ data }) => resolve(data.scheduleSteps))
      .catch(reject);
  });
};
