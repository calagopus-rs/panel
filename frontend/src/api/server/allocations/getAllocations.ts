import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, page: number, search?: string): Promise<ResponseMeta<ServerAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/allocations`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
