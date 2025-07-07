import { axiosInstance } from '@/api/axios';

export default async (uuid: string, schedule: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules/${schedule}`, {
        params: { include: 'tasks' },
      })
      .then(({ data }) => resolve(null))
      .catch(reject);
  });
};
