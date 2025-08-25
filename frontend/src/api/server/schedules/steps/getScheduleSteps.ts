import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, scheduleUuid: string, page: number): Promise<ResponseMeta<ScheduleStep>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps`, {
        params: { page },
      })
      .then(({ data }) => resolve(data.scheduleSteps))
      .catch(reject);
  });
};
