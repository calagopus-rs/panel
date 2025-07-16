import { axiosInstance } from '@/api/axios';

export default async (uuid: string, page: number): Promise<ResponseMeta<ServerAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/allocations`, {
        params: { page },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
