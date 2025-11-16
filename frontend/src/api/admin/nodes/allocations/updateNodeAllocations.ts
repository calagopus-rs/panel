import { axiosInstance } from '@/api/axios';

interface Data {
  ip?: string;
  ipAlias?: string | null;
}

export default async (nodeUuid: string, allocationUuids: string[], data: Data): Promise<{ updated: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nodes/${nodeUuid}/allocations`, {
        uuids: allocationUuids,
        ip: data.ip,
        ip_alias: data.ipAlias,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
