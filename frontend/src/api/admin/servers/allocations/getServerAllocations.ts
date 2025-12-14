import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, page: number, search?: string): Promise<ResponseMeta<ServerAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/servers/${serverUuid}/allocations`, {
        params: { page, per_page: 100, search },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
