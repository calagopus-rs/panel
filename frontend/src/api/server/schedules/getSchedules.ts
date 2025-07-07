import { axiosInstance } from '@/api/axios';

export default async (uuid: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules`)
      .then(({ data }) => resolve(null))
      .catch(reject);
  });
};
