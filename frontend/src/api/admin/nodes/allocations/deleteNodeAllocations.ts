import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string, allocationUuids: string[]): Promise<{ deleted: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nodes/${nodeUuid}/allocations`, { data: { uuids: allocationUuids } })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
