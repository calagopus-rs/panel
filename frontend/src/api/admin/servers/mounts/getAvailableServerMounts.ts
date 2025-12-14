import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, page: number, search?: string): Promise<ResponseMeta<AdminServerMount>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}/mounts/available`, {
        params: { page, per_page: 100, search },
      })
      .then(({ data }) => resolve(data.mounts))
      .catch(reject);
  });
};
