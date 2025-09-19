import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, page: number): Promise<ResponseMeta<ServerMount>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}/mounts`, {
        params: { page, per_page: 100 },
      })
      .then(({ data }) => resolve(data.mounts))
      .catch(reject);
  });
};
