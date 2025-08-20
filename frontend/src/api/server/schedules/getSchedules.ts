import { axiosInstance } from '@/api/axios';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerSchedule>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules`, {
        params: { page, search, include_password: true },
      })
      .then(({ data }) => resolve(data.schedules))
      .catch(reject);
  });
};
