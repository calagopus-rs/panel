import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, eggUuid: string, page: number, search?: string): Promise<ResponseMeta<NodeMount>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/mounts`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.mounts))
      .catch(reject);
  });
};
