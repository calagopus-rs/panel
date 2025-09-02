import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string, page: number): Promise<ResponseMeta<NodeAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}/allocations`, {
        params: { page, per_page: 100 },
      })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
