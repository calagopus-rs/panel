import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, scheduleUuid: string): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}`)
      .then(({ data }) => resolve(data.schedule))
      .catch(reject);
  });
};
