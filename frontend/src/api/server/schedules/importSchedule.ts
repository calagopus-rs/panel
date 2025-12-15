import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, data: object): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules/import`, data)
      .then(({ data }) => resolve(data.schedule))
      .catch(reject);
  });
};
