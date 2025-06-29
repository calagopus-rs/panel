import { axiosInstance } from '@/api/axios';
import { rawDataToServerSchedule } from '@/api/transformers';

export default async (uuid: string, schedule: number): Promise<Schedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules/${schedule}`, {
        params: { include: 'tasks' },
      })
      .then(({ data }) => resolve(rawDataToServerSchedule(data.attributes)))
      .catch(reject);
  });
};
