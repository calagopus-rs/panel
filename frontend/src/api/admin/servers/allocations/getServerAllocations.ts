import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, page: number): Promise<ResponseMeta<ServerAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}/allocations`, {
        params: { page, per_page: 100 },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
