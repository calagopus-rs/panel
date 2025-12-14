import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerSchedule>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.schedules))
      .catch(reject);
  });
};
