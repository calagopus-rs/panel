import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string, page: number, search: string): Promise<ResponseMeta<NodeAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}/allocations`, {
        params: { page, per_page: 100, search },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
