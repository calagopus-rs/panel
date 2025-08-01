import { axiosInstance } from '@/api/axios';

interface GetAllocationsParams {
  page?: number;
  perPage?: number;
}

export default async (nodeId: number, params: GetAllocationsParams = {}): Promise<ResponseMeta<NodeAllocation>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeId}/allocations`, { params })
      .then(({ data }) => resolve(data.allocations))
      .catch(reject);
  });
};
