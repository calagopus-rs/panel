import { axiosInstance } from '@/api/axios';

export default async (uuid: string, schedule: string): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules/${schedule}`)
      .then(({ data }) => resolve(data.schedule))
      .catch(reject);
  });
};
