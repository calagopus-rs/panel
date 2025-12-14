import { axiosInstance } from '@/api/axios.ts';

export default async (nodeUuid: string, page: number, search?: string): Promise<ResponseMeta<NodeMount>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}/mounts`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.mounts))
      .catch(reject);
  });
};
